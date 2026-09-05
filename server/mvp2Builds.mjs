import {promises as fs} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {campaignCompliance} from './mvp2Compliance.mjs';

const now=()=>new Date().toISOString();
const buildId=()=>`bld_${crypto.randomUUID()}`;

export function createCampaignBuildManifest(campaign){
 const compliance=campaignCompliance(campaign);
 const blocked=compliance.summary.blocked>0||compliance.summary.warning>0;
 const placements=(campaign.placements||[]).map(p=>{
  const format=(campaign.formats||[]).find(f=>(f.placementIds||[]).includes(p.id));
  return{
   placementId:p.id,
   platform:p.platform,
   placement:p.placement,
   width:p.width,
   height:p.height,
   formatId:format?.id||null,
   creativeVersion:Number(format?.creativeVersion||0),
   previewUrl:format?.previewUrl||'',
   previewHtml:format?.previewHtml||'',
   previewSvg:format?.previewSvg||'',
   previewType:format?.previewType||'',
   durationSec:Number.isFinite(Number(format?.durationSec))?Number(format.durationSec):null,
   estimatedZipKb:Number.isFinite(Number(format?.estimatedZipKb))?Number(format.estimatedZipKb):null,
   clickTagPresent:typeof format?.clickTagPresent==='boolean'?format.clickTagPresent:null,
   impressionUrl:p.requirements?.impressionUrl||'',
   clickUrl:p.requirements?.clickUrl||'',
   ttSource:p.requirements?.sourceLabel||p.requirements?.sourceUrl||'',
   status:compliance.placements.find(x=>x.placementId===p.id)?.status||'blocked',
  };
 });
 return{
  id:buildId(),
  campaignId:campaign.id,
  campaignName:campaign.name,
  createdAt:now(),
  state:blocked?'blocked':'ready',
  pins:{creativeVersion:Number(campaign.creativeVersion||0),mediaPlanVersion:Number(campaign.mediaPlanVersion||0),ttSnapshotVersion:Number(campaign.ttSnapshotVersion||0)},
  compliance:compliance.summary,
  placements,
 };
}

export class BuildStore{
 constructor(filePath){this.filePath=filePath;this.items=[];this.loaded=false;this.writeQueue=Promise.resolve();}
 async load(){if(this.loaded)return this;try{this.items=JSON.parse(await fs.readFile(this.filePath,'utf8'));}catch(error){if(error?.code!=='ENOENT')throw error;await fs.mkdir(path.dirname(this.filePath),{recursive:true});await this.persist();}this.loaded=true;return this;}
 async persist(){await fs.mkdir(path.dirname(this.filePath),{recursive:true});const payload=JSON.stringify(this.items,null,2),temp=`${this.filePath}.tmp`;this.writeQueue=this.writeQueue.then(async()=>{await fs.writeFile(temp,payload,{mode:0o600});await fs.rename(temp,this.filePath)});return this.writeQueue;}
 list(campaignId){return this.items.filter(x=>x.campaignId===campaignId).map(x=>structuredClone(x)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));}
 async create(campaign){await this.load();const build=createCampaignBuildManifest(campaign);this.items.push(build);await this.persist();return structuredClone(build);}
 get(campaignId,id){const item=this.items.find(x=>x.campaignId===campaignId&&x.id===id);return item?structuredClone(item):null;}
}
