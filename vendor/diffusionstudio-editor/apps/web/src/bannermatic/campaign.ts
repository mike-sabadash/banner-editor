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

export type LayoutFamily='micro-strip'|'strip'|'wide'|'rectangle'|'portrait'|'tall';
export function layoutFamily(format:Pick<CampaignFormat,'width'|'height'>):LayoutFamily{
 const ratio=Number(format.width)/Math.max(1,Number(format.height));
 if(format.height<=60)return'micro-strip';
 if(format.height<=120||ratio>=5)return'strip';
 if(ratio>=2.3)return'wide';
 if(format.height/format.width>=1.7)return'tall';
 if(format.height>format.width)return'portrait';
 return'rectangle';
}

const finite=(value:unknown)=>typeof value==='number'&&Number.isFinite(value);
type LayerRole='background'|'hero'|'logo'|'headline'|'copy'|'cta'|'legal'|'graphic'|'decor'|'unknown';
type Box={x:number;y:number;w:number;h:number};
const B=(x:number,y:number,w:number,h:number):Box=>({x,y,w,h});
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const templates:Record<LayoutFamily,Partial<Record<LayerRole,Box>>>=
 {rectangle:{background:B(0,0,100,100),logo:B(6,6,22,10),headline:B(6,12,42,24),copy:B(6,40,38,18),hero:B(52,4,44,72),graphic:B(54,10,40,64),cta:B(6,76,30,14),legal:B(6,84,88,10)},portrait:{background:B(0,0,100,100),logo:B(7,5,28,9),headline:B(7,14,86,18),copy:B(7,34,80,12),hero:B(6,48,88,34),graphic:B(14,44,72,34),cta:B(7,84,42,10),legal:B(7,84,86,10)},tall:{background:B(0,0,100,100),logo:B(8,4,32,7),headline:B(8,12,84,16),copy:B(8,29,78,10),hero:B(6,42,88,38),graphic:B(14,42,72,36),cta:B(8,84,50,8),legal:B(8,84,84,9)},wide:{background:B(0,0,100,100),logo:B(4,8,15,12),headline:B(4,24,38,28),copy:B(4,56,34,15),hero:B(45,3,36,94),graphic:B(48,8,32,82),cta:B(83,34,14,28),legal:B(4,80,72,12)},strip:{background:B(0,0,100,100),logo:B(2,16,10,68),headline:B(14,15,34,34),copy:B(14,55,32,24),hero:B(50,5,25,90),graphic:B(52,8,22,84),cta:B(78,24,20,52),legal:B(14,72,58,18)},'micro-strip':{background:B(0,0,100,100),logo:B(2,15,10,70),headline:B(14,18,40,64),copy:B(0,0,0,0),hero:B(57,4,20,92),graphic:B(59,8,18,84),cta:B(80,18,18,64),legal:B(14,24,62,52)}};
const roleWords:Record<Exclude<LayerRole,'unknown'>,RegExp>={background:/background|\bbg\b|фон/i,hero:/hero|product|image|photo|visual|товар|фото|изображ/i,logo:/logo|brand|логотип|бренд/i,headline:/headline|title|heading|заголов/i,copy:/copy|description|body|описан|текст/i,cta:/\bcta\b|button|кнопк|action/i,legal:/legal|disclaimer|terms|услов|дисклеймер/i,graphic:/graphic|illustration|art|график|иллюстр/i,decor:/decor|shape|декор/i};
function roleOf(node:StandaloneBundleModel['nodes'][number],model:StandaloneBundleModel):LayerRole{
 const name=String(node.props.name||'');
 for(const [role,pattern] of Object.entries(roleWords) as [Exclude<LayerRole,'unknown'>,RegExp][])if(pattern.test(name))return role;
 if(node.tag==='Text'||node.tag==='TextRange')return'headline';
 if(model.nodes.some(child=>child.parent===node.source&&(child.tag==='ImagePaint'||child.tag==='VideoPaint')))return'hero';
 return node.tag==='Rect'?'decor':'unknown';
}
function boxOf(props:Record<string,unknown>,format:CampaignFormat):Box{
 return{x:Number(props.x||0)/format.width*100,y:Number(props.y||0)/format.height*100,w:Number(props.width||0)/format.width*100,h:Number(props.height||0)/format.height*100};
}
function roleBox(role:LayerRole,sourceBox:Box,sourceFamily:LayoutFamily,targetFamily:LayoutFamily):Box{
 if(role==='background')return B(0,0,100,100);
 const from=templates[sourceFamily][role],to=templates[targetFamily][role];
 if(!from||!to)return sourceBox;
 if(to.w<=0||to.h<=0)return B(0,0,0,0);
 const rx=(sourceBox.x-from.x)/Math.max(.01,from.w),ry=(sourceBox.y-from.y)/Math.max(.01,from.h),rw=sourceBox.w/Math.max(.01,from.w),rh=sourceBox.h/Math.max(.01,from.h),bleed=role==='hero'||role==='graphic';
 const w=clamp(to.w*rw,Math.min(4,to.w),bleed?to.w*1.45:to.w),h=clamp(to.h*rh,Math.min(4,to.h),bleed?to.h*1.45:to.h);
 const minX=bleed?to.x-to.w*.18:to.x,maxX=bleed?to.x+to.w*1.18-w:to.x+to.w-w,minY=bleed?to.y-to.h*.18:to.y,maxY=bleed?to.y+to.h*1.18-h:to.y+to.h-h;
 return B(clamp(to.x+to.w*rx,minX,maxX),clamp(to.y+to.h*ry,minY,maxY),w,h);
}
const round=(value:number)=>Math.round(value*1000)/1000;
function adaptedProps(node:StandaloneBundleModel['nodes'][number],model:StandaloneBundleModel,source:CampaignFormat,target:CampaignFormat,singleVisual:string|undefined){
 const next={...node.props},parent=model.nodes.find(candidate=>candidate.source===node.parent),direct=parent?.tag==='Scene',role=roleOf(node,model),sourceFamily=layoutFamily(source),targetFamily=layoutFamily(target);
 if(node.tag==='ImagePaint'||node.tag==='VideoPaint')next.objectFit='cover';
 if(!direct||!finite(node.props.width)||!finite(node.props.height))return next;
 const box=singleVisual===node.source?B(0,0,100,100):roleBox(role,boxOf(node.props,source),sourceFamily,targetFamily);
 next.x=round(box.x/100*target.width);next.y=round(box.y/100*target.height);next.width=round(box.w/100*target.width);next.height=round(box.h/100*target.height);
 if(finite(node.props.fontSize))next.fontSize=round(Number(node.props.fontSize)*clamp(Math.sqrt(target.width*target.height/(source.width*source.height)),.72,1.35));
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
 const directVisuals=sourceNodes.filter(node=>node.parent===sourceScene.source&&String(node.props.name||'').toLowerCase()!=='background'&&finite(node.props.width)&&finite(node.props.height));
 const singleVisual=directVisuals.length===1&&roleOf(directVisuals[0]!,model)==='hero'?directVisuals[0]!.source:undefined;
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
   const nextProps=adaptedProps(sourceNode,model,sourceFormat,targetFormat,singleVisual);
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
