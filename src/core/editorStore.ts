import { useSyncExternalStore } from "react";
import { adaptMasterToFormat, createTextElement, defaultBannerSettings, formats, type BannerElement, type BannerSettings } from "../model";
import { interpolateValue, type AnimatableProperty, type Bezier, type Easing, type FormatKeyframes, type Keyframe } from "../timeline";

export type ProjectState = {
  version: 2;
  title: string;
  duration: number;
  activeFormat: string;
  elementsByFormat: Record<string, BannerElement[]>;
  keyframesByFormat: Record<string, FormatKeyframes>;
  backgrounds: Record<string, { color: string }>;
  settings: BannerSettings;
  formatOverrides: Record<string, boolean>;
  selectedId: string | null;
  selectedKeyframeId: string | null;
  playhead: number;
  canvasZoom: number;
};

const STORAGE_KEY="banner-editor:core-v2";
const blankElements=()=>Object.fromEntries(formats.map((f)=>[f.id,[] as BannerElement[]]));
const blankFrames=()=>Object.fromEntries(formats.map((f)=>[f.id,{} as FormatKeyframes]));
const blankBackgrounds=()=>Object.fromEntries(formats.map((f)=>[f.id,{color:"#ffffff"}]));
const blankOverrides=()=>Object.fromEntries(formats.map((f)=>[f.id,false]));
const fresh=():ProjectState=>({version:2,title:"Untitled campaign",duration:6,activeFormat:"master",elementsByFormat:blankElements(),keyframesByFormat:blankFrames(),backgrounds:blankBackgrounds(),settings:{...defaultBannerSettings},formatOverrides:blankOverrides(),selectedId:null,selectedKeyframeId:null,playhead:0,canvasZoom:1});
const load=():ProjectState=>{try{const raw=localStorage.getItem(STORAGE_KEY);return raw?{...fresh(),...JSON.parse(raw),formatOverrides:{...blankOverrides(),...(JSON.parse(raw).formatOverrides??{})}}:fresh()}catch{return fresh()}};
let state=load();
const listeners=new Set<()=>void>();
const emit=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch{}listeners.forEach((l)=>l())};
const patch=(next:Partial<ProjectState>|((s:ProjectState)=>Partial<ProjectState>))=>{state={...state,...(typeof next==="function"?next(state):next)};emit()};
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>listeners.delete(listener)};
export const useEditorState=()=>useSyncExternalStore(subscribe,()=>state,()=>state);
export const getEditorState=()=>state;
const elementList=(s=state)=>s.elementsByFormat[s.activeFormat]??[];
const frameMap=(s=state)=>s.keyframesByFormat[s.activeFormat]??{};
const currentValue=(e:BannerElement,p:AnimatableProperty,time=state.playhead,s=state)=>interpolateValue(e[p],s.keyframesByFormat[s.activeFormat]?.[e.id]??[],p,time);
const cloneFrames=(source:FormatKeyframes):FormatKeyframes=>Object.fromEntries(Object.entries(source).map(([id,list])=>[id,list.map((f)=>({...f,id:crypto.randomUUID(),bezier:f.bezier?[...f.bezier] as Bezier:undefined}))]));
const adaptedState=(s:ProjectState,force=false)=>{
  const master=s.elementsByFormat.master??[],masterFrames=s.keyframesByFormat.master??{},elements={...s.elementsByFormat},keys={...s.keyframesByFormat};
  for(const format of formats){if(format.id==="master")continue;if(!force&&s.formatOverrides[format.id])continue;elements[format.id]=adaptMasterToFormat(master,format).elements;keys[format.id]=cloneFrames(masterFrames)}
  return {elementsByFormat:elements,keyframesByFormat:keys};
};
const touchOverride=(s:ProjectState)=>s.activeFormat==="master"?s.formatOverrides:{...s.formatOverrides,[s.activeFormat]:true};

export const editorActions={
  setPlayhead(time:number,keepKeySelection=false){patch({playhead:Math.max(0,Math.min(state.duration,time)),...(keepKeySelection?{}:{selectedKeyframeId:null})})},
  setCanvasZoom(zoom:number){patch({canvasZoom:Math.max(.25,Math.min(3,zoom))})},
  select(id:string|null){patch({selectedId:id,selectedKeyframeId:null})},
  setFormat(id:string){patch((s)=>{let next:Partial<ProjectState>={activeFormat:id,selectedId:null,selectedKeyframeId:null,playhead:0};if(id!=="master"&&!(s.elementsByFormat[id]?.length)){const format=formats.find((f)=>f.id===id);if(format)next={...next,elementsByFormat:{...s.elementsByFormat,[id]:adaptMasterToFormat(s.elementsByFormat.master??[],format).elements},keyframesByFormat:{...s.keyframesByFormat,[id]:cloneFrames(s.keyframesByFormat.master??{})}}}return next})},
  adaptAll(force=true){patch((s)=>({...adaptedState(s,force),formatOverrides:force?blankOverrides():s.formatOverrides}))},
  resetFormatFromMaster(id=state.activeFormat){if(id==="master")return;patch((s)=>{const format=formats.find((f)=>f.id===id);if(!format)return{};return{elementsByFormat:{...s.elementsByFormat,[id]:adaptMasterToFormat(s.elementsByFormat.master??[],format).elements},keyframesByFormat:{...s.keyframesByFormat,[id]:cloneFrames(s.keyframesByFormat.master??{})},formatOverrides:{...s.formatOverrides,[id]:false},selectedId:null,selectedKeyframeId:null,playhead:0}})},
  addText(){const el=createTextElement();patch((s)=>{const elementsByFormat={...s.elementsByFormat,[s.activeFormat]:[...(s.elementsByFormat[s.activeFormat]??[]),el]};const base={elementsByFormat,selectedId:el.id,formatOverrides:touchOverride(s)};return s.activeFormat==="master"?{...base,...adaptedState({...s,elementsByFormat} as ProjectState,false)}:base})},
  addImage(name:string,url:string){const el:BannerElement={id:crypto.randomUUID(),kind:"image",name,text:"",assetUrl:url,x:25,y:25,width:40,scale:100,rotation:0,opacity:100,fontFamily:"Arial",fontSize:16,lineHeight:100,color:"#000000",locked:false,visible:true};patch((s)=>{const elementsByFormat={...s.elementsByFormat,[s.activeFormat]:[...(s.elementsByFormat[s.activeFormat]??[]),el]};const base={elementsByFormat,selectedId:el.id,formatOverrides:touchOverride(s)};return s.activeFormat==="master"?{...base,...adaptedState({...s,elementsByFormat} as ProjectState,false)}:base})},
  updateElement(id:string,values:Partial<BannerElement>,keyed=true){const target=elementList().find((e)=>e.id===id);if(!target)return;const anim=Object.entries(values).filter(([k])=>["x","y","scale","rotation","opacity"].includes(k)) as [AnimatableProperty,number][];const stat=Object.fromEntries(Object.entries(values).filter(([k])=>!["x","y","scale","rotation","opacity"].includes(k))) as Partial<BannerElement>;const hasKey=(frameMap()[id]??[]).some((f)=>Math.abs(f.time-state.playhead)<.035);
    if(Object.keys(stat).length||!keyed||(!hasKey&&state.playhead<=.001))patch((s)=>{const elementsByFormat={...s.elementsByFormat,[s.activeFormat]:(s.elementsByFormat[s.activeFormat]??[]).map((e)=>e.id===id?{...e,...stat,...(!keyed||(!hasKey&&s.playhead<=.001)?Object.fromEntries(anim):{})}:e)};const base={elementsByFormat,formatOverrides:touchOverride(s)};return s.activeFormat==="master"?{...base,...adaptedState({...s,elementsByFormat} as ProjectState,false)}:base});
    if(keyed&&anim.length&&(state.playhead>.001||hasKey))this.upsertProperties(id,Object.fromEntries(anim));
  },
  upsertProperties(id:string,values:Partial<Record<AnimatableProperty,number>>,easing:Easing="inOutCubic",bezier:Bezier=[.42,0,.58,1]){patch((s)=>{let list=[...(s.keyframesByFormat[s.activeFormat]?.[id]??[])];for(const[property,value]of Object.entries(values) as [AnimatableProperty,number][]){const existing=list.find((f)=>f.property===property&&Math.abs(f.time-s.playhead)<.035);const frame:Keyframe={id:existing?.id??crypto.randomUUID(),time:s.playhead,property,value,easing:existing?.easing??easing,bezier:existing?.bezier??bezier};list=[...list.filter((f)=>f.id!==frame.id),frame].sort((a,b)=>a.time-b.time)}const keyframesByFormat={...s.keyframesByFormat,[s.activeFormat]:{...(s.keyframesByFormat[s.activeFormat]??{}),[id]:list}};const base={keyframesByFormat,formatOverrides:touchOverride(s)};return s.activeFormat==="master"?{...base,...adaptedState({...s,keyframesByFormat} as ProjectState,false)}:base})},
  toggleKeyAtCurrent(id:string){const target=elementList().find((e)=>e.id===id);if(!target)return;const at=(frameMap()[id]??[]).filter((f)=>Math.abs(f.time-state.playhead)<.035);if(at.length){patch((s)=>{const keyframesByFormat={...s.keyframesByFormat,[s.activeFormat]:{...(s.keyframesByFormat[s.activeFormat]??{}),[id]:(s.keyframesByFormat[s.activeFormat]?.[id]??[]).filter((f)=>Math.abs(f.time-s.playhead)>=.035)}};const base={keyframesByFormat,selectedKeyframeId:null,formatOverrides:touchOverride(s)};return s.activeFormat==="master"?{...base,...adaptedState({...s,keyframesByFormat} as ProjectState,false)}:base});return}const values=Object.fromEntries((["x","y","scale","rotation","opacity"] as AnimatableProperty[]).map((p)=>[p,currentValue(target,p,state.playhead,state)]));this.upsertProperties(id,values)},
  selectKey(id:string,elementId:string){const frame=(frameMap()[elementId]??[]).find((f)=>f.id===id);if(frame)patch({selectedId:elementId,selectedKeyframeId:id,playhead:frame.time})},
  moveKeyframeGroup(elementId:string,time:number,newTime:number){patch((s)=>{const list=s.keyframesByFormat[s.activeFormat]?.[elementId]??[],previous=s.playhead;const clamped=Math.max(0,Math.min(s.duration,newTime));const keyframesByFormat={...s.keyframesByFormat,[s.activeFormat]:{...(s.keyframesByFormat[s.activeFormat]??{}),[elementId]:list.map((f)=>(Math.abs(f.time-time)<.035||Math.abs(f.time-previous)<.035)?{...f,time:clamped}:f).sort((a,b)=>a.time-b.time)}};return{keyframesByFormat,playhead:clamped,formatOverrides:touchOverride(s)}})},
  deleteSelectedKeyframe(){if(!state.selectedId||!state.selectedKeyframeId)return;const id=state.selectedId,frame=(frameMap()[id]??[]).find((f)=>f.id===state.selectedKeyframeId);if(!frame)return;patch((s)=>({keyframesByFormat:{...s.keyframesByFormat,[s.activeFormat]:{...(s.keyframesByFormat[s.activeFormat]??{}),[id]:(s.keyframesByFormat[s.activeFormat]?.[id]??[]).filter((f)=>Math.abs(f.time-frame.time)>=.035)}},selectedKeyframeId:null,formatOverrides:touchOverride(s)}))},
  setSelectedKeyEasing(easing:Easing,bezier:Bezier){if(!state.selectedId||!state.selectedKeyframeId)return;const id=state.selectedId,frame=(frameMap()[id]??[]).find((f)=>f.id===state.selectedKeyframeId);if(!frame)return;patch((s)=>({keyframesByFormat:{...s.keyframesByFormat,[s.activeFormat]:{...(s.keyframesByFormat[s.activeFormat]??{}),[id]:(s.keyframesByFormat[s.activeFormat]?.[id]??[]).map((f)=>Math.abs(f.time-frame.time)<.035?{...f,easing,bezier:[...bezier] as Bezier}:f)}}}))},
  removeSelected(){if(!state.selectedId)return;const id=state.selectedId;patch((s)=>{const elementsByFormat={...s.elementsByFormat,[s.activeFormat]:(s.elementsByFormat[s.activeFormat]??[]).filter((e)=>e.id!==id)},keyframesByFormat={...s.keyframesByFormat,[s.activeFormat]:Object.fromEntries(Object.entries(s.keyframesByFormat[s.activeFormat]??{}).filter(([k])=>k!==id))};const base={elementsByFormat,keyframesByFormat,selectedId:null,selectedKeyframeId:null,formatOverrides:touchOverride(s)};return s.activeFormat==="master"?{...base,...adaptedState({...s,elementsByFormat,keyframesByFormat} as ProjectState,false)}:base})},
  newProject(){state=fresh();emit()},
  importProject(project:ProjectState){state={...fresh(),...project,version:2,formatOverrides:{...blankOverrides(),...(project.formatOverrides??{})}};emit()},
  exportProject(){return JSON.stringify(state,null,2)},
};
export const getDisplayElement=(element:BannerElement,time=state.playhead):BannerElement=>({...element,x:currentValue(element,"x",time,state),y:currentValue(element,"y",time,state),scale:currentValue(element,"scale",time,state),rotation:currentValue(element,"rotation",time,state),opacity:currentValue(element,"opacity",time,state)});
