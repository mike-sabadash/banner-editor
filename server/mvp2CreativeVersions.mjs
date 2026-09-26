import {promises as fs} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const clone=value=>JSON.parse(JSON.stringify(value));
const now=()=>new Date().toISOString();
const id=()=>`crv_${crypto.randomUUID()}`;

export function creativeSnapshot(campaign,{touched=[]}={}){
 return{
  id:id(),campaignId:campaign.id,version:Number(campaign.creativeVersion||0),createdAt:now(),touched:[...touched],
  formats:(campaign.formats||[]).filter(f=>f.creativeState==='published').map(f=>({
   formatId:f.id,width:f.width,height:f.height,size:f.size,creativeVersion:Number(f.creativeVersion||0),
   previewUrl:f.previewUrl||'',previewHtml:f.previewHtml||'',previewSvg:f.previewSvg||'',previewType:f.previewType||'',
   durationSec:Number.isFinite(Number(f.durationSec))?Number(f.durationSec):null,
   estimatedZipKb:Number.isFinite(Number(f.estimatedZipKb))?Number(f.estimatedZipKb):null,
   clickTagPresent:typeof f.clickTagPresent==='boolean'?f.clickTagPresent:null,publishedAt:f.publishedAt||null,
  })),
 };
}

export class CreativeVersionStore{
 constructor(filePath){this.filePath=filePath;this.items=[];this.loaded=false;this.queue=Promise.resolve();}
 async load(){if(this.loaded)return this;try{this.items=JSON.parse(await fs.readFile(this.filePath,'utf8'));}catch(error){if(error?.code!=='ENOENT')throw error;await fs.mkdir(path.dirname(this.filePath),{recursive:true});await this.persist();}this.loaded=true;return this;}
 async persist(){await fs.mkdir(path.dirname(this.filePath),{recursive:true});const payload=JSON.stringify(this.items,null,2),tmp=`${this.filePath}.tmp`;this.queue=this.queue.then(async()=>{await fs.writeFile(tmp,payload,{mode:0o600});await fs.rename(tmp,this.filePath)});return this.queue;}
 list(campaignId){return this.items.filter(x=>x.campaignId===campaignId).map(clone).sort((a,b)=>b.version-a.version);}
 async add(campaign,meta){await this.load();const snapshot=creativeSnapshot(campaign,meta);if(this.items.some(x=>x.campaignId===campaign.id&&x.version===snapshot.version))throw Object.assign(new Error('Creative version already exists'),{status:409});this.items.push(snapshot);await this.persist();return clone(snapshot);}
 get(campaignId,version){const item=this.items.find(x=>x.campaignId===campaignId&&x.version===Number(version));return item?clone(item):null;}
 async deleteCampaign(campaignId){await this.load();this.items=this.items.filter(x=>x.campaignId!==campaignId);await this.persist();}
}
