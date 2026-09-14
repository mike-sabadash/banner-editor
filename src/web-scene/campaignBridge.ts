import type {Campaign,Placement,RequirementSet,VisualFormat} from "../mvp2/domain";
import {familyFor,type OutputFormat,type Scene} from "./sceneModel";

export type FormatTT={
  formatId:string;
  placements:string[];
  platforms:string[];
  maxZipKb?:number;
  maxDurationSec?:number;
  clickTagRequired:boolean;
  trackingRequired:boolean;
  legal:string[];
  requiredElements:string[];
  sources:string[];
};

export type TTCheck={status:"ready"|"attention"|"unknown";issues:string[];notes:string[]};

const nums=(values:Array<number|null|undefined>)=>values.filter((v):v is number=>typeof v==="number"&&Number.isFinite(v));
const strings=(values:Array<string|null|undefined>)=>[...new Set(values.map(v=>String(v||"").trim()).filter(Boolean))];

export function formatsFromCampaign(campaign?:Campaign):OutputFormat[]{
  if(!campaign?.formats?.length)return [];
  return campaign.formats.map(f=>({id:f.id,width:f.width,height:f.height,label:f.size||`${f.width}×${f.height}`,family:familyFor(f.width,f.height)}));
}

function linkedPlacements(campaign:Campaign,format:VisualFormat):Placement[]{
  const ids=new Set(format.placementIds||[]);
  return campaign.placements.filter(p=>ids.has(p.id)||(p.width===format.width&&p.height===format.height));
}

export function ttForFormat(campaign:Campaign,formatId:string):FormatTT|undefined{
  const format=campaign.formats.find(f=>f.id===formatId);
  if(!format)return undefined;
  const placements=linkedPlacements(campaign,format);
  const reqs:RequirementSet[]=placements.map(p=>p.requirements||{});
  const zip=nums(reqs.map(r=>r.maxZipKb)),duration=nums(reqs.map(r=>r.maxDurationSec));
  return {
    formatId,
    placements:placements.map(p=>p.placement),
    platforms:strings(placements.map(p=>p.platform)),
    maxZipKb:zip.length?Math.min(...zip):undefined,
    maxDurationSec:duration.length?Math.min(...duration):undefined,
    clickTagRequired:reqs.some(r=>r.clickTag===true),
    trackingRequired:reqs.some(r=>r.tracking===true),
    legal:strings(reqs.map(r=>r.legal)),
    requiredElements:strings(reqs.flatMap(r=>r.requiredElements||[])),
    sources:strings(reqs.map(r=>r.sourceLabel||r.sourceUrl))
  };
}

export function validateScenesForTT(scenes:Scene[],tt?:FormatTT):TTCheck{
  if(!tt)return {status:"unknown",issues:[],notes:["No TT linked to this format"]};
  const issues:string[]=[],notes:string[]=[];
  const totalSec=scenes.reduce((sum,s)=>sum+s.durationMs,0)/1000;
  if(tt.maxDurationSec&&totalSec>tt.maxDurationSec)issues.push(`Duration ${totalSec.toFixed(1)}s exceeds ${tt.maxDurationSec}s`);
  const roles=new Set(scenes.flatMap(s=>s.layers.filter(l=>l.visible).map(l=>l.role)));
  const needsLegal=tt.legal.length>0||tt.requiredElements.some(v=>/legal|дисклеймер|юрид/i.test(v));
  if(needsLegal&&!roles.has("legal"))issues.push("Legal is required by TT but no Legal layer exists");
  if(tt.clickTagRequired)notes.push("clickTAG required at export");
  if(tt.trackingRequired)notes.push("Tracking/pixel required at export");
  if(tt.maxZipKb)notes.push(`ZIP ≤ ${tt.maxZipKb} KB`);
  if(tt.legal.length)notes.push(`Legal: ${tt.legal.join(" · ")}`);
  if(!tt.sources.length)notes.push("TT source is not identified");
  return {status:issues.length?"attention":tt.sources.length?"ready":"unknown",issues,notes};
}
