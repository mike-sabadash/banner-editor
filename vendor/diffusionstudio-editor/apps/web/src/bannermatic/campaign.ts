import {decodeStandaloneBundle,encodeStandaloneBundle,type StandaloneBundleModel} from '../projects/standalone-model';

export type DeliveryArtifactMeta={id:string;kind:string;mimeType:string;width:number;height:number;durationSec:number;bytes:number;sha256:string;createdAt:string};
export type CampaignFormat={id:string;width:number;height:number;size:string;placementIds:string[];exportScale?:1|2;requiredOutputTypes?:string[];creativeState:string;deliveryArtifacts?:Record<string,DeliveryArtifactMeta>};
export type CampaignPlacement={id:string;platform:string;placement:string;width:number;height:number;creativeType?:string;requirements?:{exportType?:string;maxZipKb?:number|null;maxDurationSec?:number|null;clickTag?:boolean|null;clickTagVariable?:string;clickUrl?:string;tracking?:boolean|null;impressionUrl?:string;sourceLabel?:string;sourceUrl?:string}};
export type BannermaticCampaign={id:string;name:string;locale:'ru'|'en';formats:CampaignFormat[];placements:CampaignPlacement[];creativeVersion?:number;mediaPlanVersion?:number};
export const TOKEN_KEY='bannermatic:token';
export const SCENE_PREFIX='BM_FORMAT::';
const DIFFUSION_DOCUMENT_MARKER='BANNERMATIC_STANDALONE_MODEL:';

export function normalizeOutputType(value:unknown){const raw=String(value||'html5').toLowerCase().replace(/\s+/g,'').replace(/_/g,'-');if(raw.includes('html')&&raw.includes('gif'))return'html5+gif';if(raw.includes('html'))return'html5';if(raw==='jpeg'||raw==='jpg')return'jpg';if(raw==='png')return'png';if(raw==='gif')return'gif';if(raw==='mp4'||raw==='webm'||raw==='mov'||raw.includes('video'))return'video';if(raw==='webp')return'webp';return'html5'}
export function requiredOutputs(campaign:BannermaticCampaign,format:CampaignFormat){return[...new Set(format.placementIds.map(id=>campaign.placements.find(p=>p.id===id)).filter(Boolean).map(p=>normalizeOutputType(p?.requirements?.exportType||p?.creativeType||'html5')))]}
export function sceneName(format:CampaignFormat){return`${SCENE_PREFIX}${format.id}::${format.width}x${format.height}`}
export function formatIdFromSceneName(value:unknown){const name=String(value||'');return name.startsWith(SCENE_PREFIX)?name.slice(SCENE_PREFIX.length).split('::')[0]:null}

export type LayoutFamily='micro-strip'|'landscape'|'square'|'portrait'|'tall';
export function layoutFamily(format:Pick<CampaignFormat,'width'|'height'>):LayoutFamily{
 const ratio=Number(format.width)/Math.max(1,Number(format.height));
 if(ratio>=4.5)return'micro-strip';
 if(ratio>=1.25)return'landscape';
 if(ratio>=.8)return'square';
 if(ratio>=.55)return'portrait';
 return'tall';
}

const finite=(value:unknown)=>typeof value==='number'&&Number.isFinite(value);
const geometryKeys=new Set(['x','y','width','height','fontSize','strokeWidth','cornerRadius','radius']);
function adaptedProps(props:Record<string,unknown>,source:CampaignFormat,target:CampaignFormat){
 const sx=target.width/source.width,sy=target.height/source.height,uniform=Math.min(sx,sy),next={...props};
 for(const key of geometryKeys){
  const value=props[key];
  if(!finite(value))continue;
  const scale=key==='x'||key==='width'?sx:key==='y'||key==='height'?sy:uniform;
  next[key]=Math.round(Number(value)*scale*1000)/1000;
 }
 return next;
}
function descendants(model:StandaloneBundleModel,parent:string){
 const found=new Set([parent]),result=[] as StandaloneBundleModel['nodes'];
 let changed=true;
 while(changed){changed=false;for(const node of model.nodes)if(node.parent&&found.has(node.parent)&&!found.has(node.source)){found.add(node.source);result.push(node);changed=true}}
 return result;
}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function mergeInherited(current:Record<string,unknown>,previous:Record<string,unknown>,next:Record<string,unknown>){
 const merged={...current};
 for(const [key,value] of Object.entries(next))if(!(key in previous)||same(current[key],previous[key]))merged[key]=value;
 return merged;
}

/** Copies the active master through geometry families while retaining properties edited locally after the previous rollout. */
export function rolloutCampaignBundle(campaign:BannermaticCampaign,sourceFormatId:string,saved:string){
 const model=decodeStandaloneBundle(saved);
 if(!model||model.campaignId!==campaign.id)throw new Error('The editable campaign document is unavailable.');
 const sourceFormat=campaign.formats.find(format=>format.id===sourceFormatId);
 const sourceScene=model.nodes.find(node=>node.tag==='Scene'&&formatIdFromSceneName(node.props.name)===sourceFormatId);
 if(!sourceFormat||!sourceScene)throw new Error('Select the completed master format first.');
 const sourceNodes=descendants(model,sourceScene.source);
 if(!sourceNodes.some(node=>String(node.props.name||'').toLowerCase()!=='background'))throw new Error('Add the campaign design to the selected master before rollout.');
 const families=new Set<LayoutFamily>();let generated=0;
 for(const targetFormat of campaign.formats){
  if(targetFormat.id===sourceFormatId)continue;
  const targetScene=model.nodes.find(node=>node.tag==='Scene'&&formatIdFromSceneName(node.props.name)===targetFormat.id);
  if(!targetScene)continue;
  const family=layoutFamily(targetFormat);families.add(family);
  const targetNodes=descendants(model,targetScene.source),byLink=new Map(targetNodes.filter(node=>node.link).map(node=>[node.link!.source,node]));
  const mapped=new Map<string,string>([[sourceScene.source,targetScene.source]]);
  for(const sourceNode of sourceNodes){
   const parent=mapped.get(sourceNode.parent||sourceScene.source)||targetScene.source;
   const nextProps=adaptedProps(sourceNode.props,sourceFormat,targetFormat);
   const existing=byLink.get(sourceNode.source)||targetNodes.find(node=>String(node.props.name||'')==='Background'&&String(sourceNode.props.name||'')==='Background');
   if(existing){
    const previous=existing.link?.inheritedProps||{};
    existing.props=mergeInherited(existing.props,previous,nextProps);
    if(sourceNode.text!==undefined&&(existing.link?.inheritedText===undefined||existing.text===existing.link.inheritedText))existing.text=sourceNode.text;
    existing.link={source:sourceNode.source,family,inheritedProps:nextProps,...(sourceNode.text===undefined?{}:{inheritedText:sourceNode.text})};
    existing.parent=parent;mapped.set(sourceNode.source,existing.source);
   }else{
    const source=`bannermatic-rollout:${targetFormat.id}:${crypto.randomUUID()}`;
    model.nodes.push({source,tag:sourceNode.tag,parent,props:nextProps,...(sourceNode.text===undefined?{}:{text:sourceNode.text}),link:{source:sourceNode.source,family,inheritedProps:nextProps,...(sourceNode.text===undefined?{}:{inheritedText:sourceNode.text})}});
    mapped.set(sourceNode.source,source);
   }
  }
  generated++;
 }
 return{bundle:encodeStandaloneBundle(model),generated,families:[...families]};
}

const CAMPAIGN_SCENE_GAP=160;

/** Campaign formats are separate top-level artboards on Diffusion's infinite canvas. */
export function campaignFormatPositions(formats:CampaignFormat[]){
 let x=0;
 return new Map(formats.map(format=>{
  const position={x,y:0};
  x+=Number(format.width)+CAMPAIGN_SCENE_GAP;
  return[format.id,position] as const;
 }));
}

export function buildCampaignBundle(campaign:BannermaticCampaign,preferredFormatId='',saved=''){
 const formats=campaign.formats.length?campaign.formats:[{id:'fmt-300x600',width:300,height:600,size:'300×600',placementIds:[],creativeState:'missing'}];
 const active=formats.some(format=>format.id===preferredFormatId)?preferredFormatId:formats[0].id;
 const stageSource=`bannermatic:${campaign.id}:stage`;
 const prior=decodeStandaloneBundle(saved);
 const model:StandaloneBundleModel=prior?.campaignId===campaign.id?prior:{version:1,campaignId:campaign.id,nodes:[{source:stageSource,tag:'Stage',props:{background:'#161616',camera:[0.72,0,0,0.72,180,90]}}]};
 const expected=new Set(formats.map(format=>`bannermatic:${campaign.id}:${format.id}`));
 const oldScenes=model.nodes.filter(node=>node.tag==='Scene'&&node.parent===stageSource);
 const positions=campaignFormatPositions(formats);

 for(const scene of oldScenes)if(!expected.has(scene.source)){
  const doomed=new Set([scene.source]);
  let changed=true;
  while(changed){
   changed=false;
   for(const node of model.nodes)if(node.parent&&doomed.has(node.parent)&&!doomed.has(node.source)){
    doomed.add(node.source);
    changed=true;
   }
  }
  model.nodes=model.nodes.filter(node=>!doomed.has(node.source));
 }

 for(const format of formats){
  const source=`bannermatic:${campaign.id}:${format.id}`;
  const durations=format.placementIds.map(id=>campaign.placements.find(placement=>placement.id===id)?.requirements?.maxDurationSec).filter((value):value is number=>Number(value)>0);
  const duration=Math.max(.25,Math.min(...(durations.length?durations:[6])));
  const position=positions.get(format.id)!;
  const props={name:sceneName(format),x:position.x,y:position.y,width:Number(format.width),height:Number(format.height),fill:'#101114',active:format.id===active};
  const scene=model.nodes.find(node=>node.source===source);
  if(scene)scene.props={...scene.props,...props};
  else model.nodes.push(
   {source,tag:'Scene',parent:stageSource,props},
   {source:`${source}:background`,tag:'Rect',parent:source,props:{name:'Background',x:0,y:0,width:Number(format.width),height:Number(format.height),fill:'#101114',start:0,end:duration}},
  );
 }

 return encodeStandaloneBundle(model);
}

export async function loadCampaign(id:string):Promise<BannermaticCampaign>{const token=localStorage.getItem(TOKEN_KEY)||'';if(!token)throw new Error('Sign in to Bannermatic before opening a campaign editor.');const response=await fetch(`/api/campaigns/${encodeURIComponent(id)}`,{headers:{authorization:`Bearer ${token}`}}),data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Campaign request failed: ${response.status}`);return data as BannermaticCampaign}
export async function loadCampaignBundleRecord(id:string){const token=localStorage.getItem(TOKEN_KEY)||'',response=await fetch(`/api/campaigns/${encodeURIComponent(id)}/diffusion-document`,{headers:{authorization:`Bearer ${token}`}}),data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Creative document request failed: ${response.status}`);return{bundle:String(data.bundle||''),updatedAt:typeof data.updatedAt==='string'?data.updatedAt:null}}
export async function loadCampaignBundle(id:string){return(await loadCampaignBundleRecord(id)).bundle}
export async function saveCampaignBundle(id:string,bundle:string){if(!bundle.includes(DIFFUSION_DOCUMENT_MARKER))throw new Error('Invalid Diffusion campaign document.');const token=localStorage.getItem(TOKEN_KEY)||'',response=await fetch(`/api/campaigns/${encodeURIComponent(id)}/diffusion-document`,{method:'PATCH',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({bundle})}),data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Creative document save failed: ${response.status}`);return data}
