import crypto from "node:crypto";
import path from "node:path";
import {promises as fs} from "node:fs";

const SAFE_KINDS=new Set(["png","jpg","gif","webp","video"]);
const MIME_BY_KIND={png:new Set(["image/png"]),jpg:new Set(["image/jpeg"]),gif:new Set(["image/gif"]),webp:new Set(["image/webp"]),video:new Set(["video/mp4","video/webm","video/quicktime"])};
const EXT_BY_MIME={"image/png":"png","image/jpeg":"jpg","image/gif":"gif","image/webp":"webp","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"};
const clean=value=>String(value||"").replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,120);

function validate(input){
 const kind=String(input?.kind||"").toLowerCase(),mimeType=String(input?.mimeType||"").toLowerCase();
 if(!SAFE_KINDS.has(kind)||!MIME_BY_KIND[kind].has(mimeType))throw Object.assign(new Error("Unsupported delivery artifact type"),{status:400});
 const data=String(input?.dataBase64||"").replace(/^data:[^;]+;base64,/,"");
 if(!data||!/^[a-z0-9+/=\s]+$/i.test(data))throw Object.assign(new Error("Artifact dataBase64 is required"),{status:400});
 const bytes=Buffer.from(data,"base64");
 if(!bytes.length)throw Object.assign(new Error("Artifact is empty"),{status:400});
 if(bytes.length>25_000_000)throw Object.assign(new Error("Artifact exceeds the 25 MB upload limit"),{status:413});
 const width=Number(input.width),height=Number(input.height),durationSec=Number(input.durationSec||0);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Object.assign(new Error("Artifact dimensions must be positive integers"),{status:400});
 return{kind,mimeType,bytes,width,height,durationSec:Number.isFinite(durationSec)&&durationSec>=0?durationSec:0,extension:EXT_BY_MIME[mimeType]};
}

export class DeliveryArtifactStore{
 constructor(rootPath){this.rootPath=rootPath;this.indexPath=path.join(rootPath,"index.json");this.items=[];this.loaded=false;this.writeQueue=Promise.resolve()}
 async load(){if(this.loaded)return this;try{this.items=JSON.parse(await fs.readFile(this.indexPath,"utf8"));if(!Array.isArray(this.items))this.items=[]}catch(error){if(error?.code!=="ENOENT")throw error;this.items=[];await fs.mkdir(this.rootPath,{recursive:true});await this.persist()}this.loaded=true;return this}
 async persist(){await fs.mkdir(this.rootPath,{recursive:true});const payload=JSON.stringify(this.items,null,2),temp=this.indexPath+".tmp";this.writeQueue=this.writeQueue.then(async()=>{await fs.writeFile(temp,payload,{mode:0o600});await fs.rename(temp,this.indexPath)});return this.writeQueue}
 async put(campaignId,formatId,input){await this.load();const value=validate(input),id=crypto.randomUUID(),relative=path.join(clean(campaignId),clean(formatId),`${value.kind}-${id}.${value.extension}`),absolute=path.join(this.rootPath,relative);await fs.mkdir(path.dirname(absolute),{recursive:true});await fs.writeFile(absolute,value.bytes,{mode:0o600});const item={id,campaignId:String(campaignId),formatId:String(formatId),kind:value.kind,mimeType:value.mimeType,width:value.width,height:value.height,durationSec:value.durationSec,bytes:value.bytes.length,sha256:crypto.createHash("sha256").update(value.bytes).digest("hex"),relativePath:relative,createdAt:new Date().toISOString()};const replaced=this.items.filter(x=>x.campaignId===item.campaignId&&x.formatId===item.formatId&&x.kind===item.kind);this.items=this.items.filter(x=>!replaced.includes(x));this.items.push(item);await this.persist();await Promise.all(replaced.map(x=>fs.unlink(path.join(this.rootPath,x.relativePath)).catch(()=>{})));return structuredClone(item)}
 list(campaignId){return this.items.filter(x=>x.campaignId===String(campaignId)).map(x=>structuredClone(x))}
 metadataForFormat(campaignId,formatId){return Object.fromEntries(this.list(campaignId).filter(x=>x.formatId===String(formatId)).map(x=>[x.kind,{id:x.id,kind:x.kind,mimeType:x.mimeType,width:x.width,height:x.height,durationSec:x.durationSec,bytes:x.bytes,sha256:x.sha256,createdAt:x.createdAt}]))}
 async contents(campaignId){await this.load();const out={};for(const item of this.items.filter(x=>x.campaignId===String(campaignId))){out[`${item.formatId}:${item.kind}`]={...structuredClone(item),content:await fs.readFile(path.join(this.rootPath,item.relativePath))}}return out}
 async deleteCampaign(campaignId){await this.load();const id=String(campaignId),removed=this.items.filter(x=>x.campaignId===id);this.items=this.items.filter(x=>x.campaignId!==id);await this.persist();await Promise.all(removed.map(x=>fs.unlink(path.join(this.rootPath,x.relativePath)).catch(()=>{})));return removed.length}
}
