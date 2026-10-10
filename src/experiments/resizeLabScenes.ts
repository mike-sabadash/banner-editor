import {defaultMotion,type MotionSettings,type MotionPreset} from './resizeLabEditing';
export type SceneCopy={headline:string;subline:string;cta:string};
export type BannerScene={id:string;name:string;copy:SceneCopy;duration:number;motion:MotionSettings};
const presets:MotionPreset[]=['none','fade','slide-up','slide-side','scale'];
const finite=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
export function restoreScenes(value:unknown):BannerScene[]{
 if(!Array.isArray(value))return [];
 const ids=new Set<string>();
 return value.filter(x=>x&&typeof x==='object').slice(0,20).map((s,index)=>{
  const id=typeof s.id==='string'&&/^[\w-]{1,80}$/.test(s.id)&&!ids.has(s.id)?s.id:`restored-${index}`;ids.add(id);
  const m=s.motion||{};
  return {id,name:typeof s.name==='string'?s.name.slice(0,80):`Сцена ${index+1}`,copy:{headline:String(s.copy?.headline??''),subline:String(s.copy?.subline??''),cta:String(s.copy?.cta??'')},duration:finite(s.duration,4000,500,30000),motion:{...defaultMotion,preset:presets.includes(m.preset)?m.preset:'fade',exit:presets.includes(m.exit)?m.exit:'fade',duration:finite(m.duration,600,100,2000),exitDuration:finite(m.exitDuration,500,100,2000),stagger:finite(m.stagger,150,0,400),distance:finite(m.distance,20,0,100),delay:finite(m.delay,0,0,10000),hold:finite(m.hold,2000,0,30000),easing:['ease-out','ease-in-out','cubic-bezier(0.22, 1, 0.36, 1)'].includes(m.easing)?m.easing:'ease-out'}};
 });
}
export function sequenceDuration(scenes:BannerScene[]){return scenes.reduce((sum,s)=>sum+s.duration,0)}
export function sceneAt(scenes:BannerScene[],time:number,loop=false){const total=sequenceDuration(scenes);if(!total)return {index:0,localTime:0};const t=loop?((time%total)+total)%total:Math.max(0,Math.min(total,time));let start=0;for(let i=0;i<scenes.length;i++){if(t<start+scenes[i].duration||i===scenes.length-1)return {index:i,localTime:t-start};start+=scenes[i].duration}return {index:0,localTime:0}}
export function createScene(copy:SceneCopy,index:number,motion:MotionSettings=defaultMotion):BannerScene{return {id:crypto.randomUUID(),name:`Сцена ${index+1}`,copy:{...copy},duration:Math.max(4000,motion.delay+motion.duration+motion.stagger*3+motion.hold+motion.exitDuration),motion:{...motion,preset:motion.preset==='none'?'fade':motion.preset,exit:motion.exit==='none'?'fade':motion.exit}}}
const hidden=(preset:MotionPreset,distance:number)=>preset==='slide-up'?`opacity:0;translate:0 ${distance}px;scale:1`:preset==='slide-side'?`opacity:0;translate:${distance}px 0;scale:1`:preset==='scale'?'opacity:0;translate:0 0;scale:.94':'opacity:0;translate:0 0;scale:1';
const shown='opacity:1;translate:0 0;scale:1';
// A single CSS clock drives every scene and layer, including standalone HTML.
// translate/scale are independent of manual transform overrides.
export function sequenceMarkup(scenes:BannerScene[],frame:(scene:BannerScene)=>string,{loop=false,time=0,playing=false}:{loop?:boolean;time?:number;playing?:boolean}={}){
 const total=sequenceDuration(scenes);if(!total)return '';
 const pct=(ms:number)=>`${Math.max(0,Math.min(100,ms/total*100)).toFixed(6)}%`;
 const clock=`${total}ms linear var(--rl-sequence-delay) ${loop?'infinite':'1'} both`;
 let start=0;const rules:string[]=[];
 const frames=scenes.map((s,index)=>{
  const end=start+s.duration,scope=`.rl-sequence>.rl-scene-${index}`,name=`rl-scene-visibility-${index}`;
  const last=index===scenes.length-1&&!loop;
  rules.push(`@keyframes ${name}{0%{visibility:hidden}${pct(start)}{visibility:visible}${pct(Math.max(start,end-.01))}{visibility:visible}${pct(end)}{visibility:${last?'visible':'hidden'}}100%{visibility:${last?'visible':'hidden'}}}${scope}{position:absolute;inset:0;animation:${name} ${clock};animation-timing-function:steps(1,end);animation-play-state:var(--rl-sequence-state)}`);
  const m=s.motion;
  // Fit entrance, delay, stagger and exit inside short scenes proportionally.
  const budget=m.delay+(m.preset==='none'?0:m.duration+m.stagger*3)+(m.exit==='none'?0:m.exitDuration);
  const factor=budget>s.duration*.9?s.duration*.9/budget:1;
  for(const [order,layer] of ['logo','headline','subline','cta'].entries()){
   const entry=start+(m.delay+(m.preset==='none'?0:order*m.stagger))*factor;
   const entryEnd=entry+(m.preset==='none'?0:m.duration*factor);
   const exitStart=end-(m.exit==='none'?0:m.exitDuration*factor);
   const anim=`rl-sequence-layer-${index}-${order}`;
   const entryHidden=m.preset==='none'?shown:hidden(m.preset,m.distance);
   const exitHidden=m.exit==='none'?shown:hidden(m.exit,m.distance);
   rules.push(`@keyframes ${anim}{0%{${entryHidden}}${pct(entry)}{${entryHidden};animation-timing-function:${m.easing}}${pct(entryEnd)}{${shown}}${pct(exitStart)}{${shown};animation-timing-function:${m.easing}}${pct(end)}{${exitHidden}}100%{${exitHidden}}}${scope} [data-edit-layer="${layer}"]{animation:${anim} ${clock};animation-play-state:var(--rl-sequence-state)}`);
  }
  start=end;return `<div class="rl-scene-${index}" data-scene-id="${s.id}">${frame(s)}</div>`;
 }).join('');
 return `<style>${rules.join('')}@media(prefers-reduced-motion:reduce){.rl-sequence [data-edit-layer]{animation:none!important}}</style><div class="rl-sequence" style="position:relative;width:100%;height:100%;--rl-sequence-delay:-${Math.max(0,Math.min(total,time))}ms;--rl-sequence-state:${playing?'running':'paused'}">${frames}</div>`;
}
