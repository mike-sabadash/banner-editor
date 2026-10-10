import {defaultMotion,type MotionSettings} from './resizeLabEditing';
import {type BannerScene,type SceneCopy,sequenceDuration} from './resizeLabScenes';
export const sceneLayerKeys=['background','logo','headline','subline','cta','overlay'] as const;
export type SceneLayerKey=typeof sceneLayerKeys[number];
export type SceneLayer={action:'keep'|'change'|'hide';image?:string;x:number;y:number;width:number;motion:MotionSettings};
export type SceneLayers=Record<SceneLayerKey,SceneLayer>;
export type ResolvedScene=BannerScene&{layers:SceneLayers;visible:Record<SceneLayerKey,boolean>;background:string;overlay:string};
export const stillMotion={...defaultMotion};
export function initialLayers():SceneLayers{return Object.fromEntries(sceneLayerKeys.map(key=>[key,{action:key==='overlay'?'hide':'keep',x:50,y:50,width:40,motion:{...stillMotion}}])) as SceneLayers;}
export function cloneLayers(layers:SceneLayers):SceneLayers{return Object.fromEntries(sceneLayerKeys.map(key=>[key,{...layers[key],motion:{...layers[key].motion}}])) as SceneLayers;}
export function restoreLayers(value:unknown,motion:MotionSettings):SceneLayers|undefined{
 if(!value||typeof value!=='object')return undefined;
 const source=value as Partial<SceneLayers>,layers=initialLayers();
 for(const key of sceneLayerKeys){const s=source[key];if(!s||typeof s!=='object')continue;const safe=(n:unknown,fallback:number,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
 const m=s.motion||motion;const presets=['none','fade','slide-up','slide-side','scale'];
 layers[key]={action:['keep','change','hide'].includes(s.action)?s.action:'keep',image:typeof s.image==='string'&&(/^(data:image\/(png|jpe?g|webp|svg\+xml);base64,|\/api\/resize-lab\/assets\/[a-f0-9]{64}\.(png|jpg|webp|svg)$)/.test(s.image))?s.image:undefined,x:safe(s.x,50,0,100),y:safe(s.y,50,0,100),width:safe(s.width,40,1,100),motion:{...stillMotion,preset:presets.includes(m.preset)?m.preset:'none',exit:presets.includes(m.exit)?m.exit:'none',duration:safe(m.duration,600,100,2000),exitDuration:safe(m.exitDuration,500,100,2000),delay:safe(m.delay,0,0,10000),distance:safe(m.distance,20,0,100),easing:['ease-out','ease-in-out','cubic-bezier(0.22, 1, 0.36, 1)'].includes(m.easing)?m.easing:'ease-out'}};
 }return layers;
}
export function effectiveLayers(s:BannerScene){if(s.layers)return cloneLayers(s.layers);const layers=initialLayers();for(const key of ['logo','headline','subline','cta'] as const)layers[key]={...layers[key],action:'change',motion:{...s.motion,delay:s.motion.delay+['logo','headline','subline','cta'].indexOf(key)*s.motion.stagger}};return layers;}
export function resolveScenes(scenes:BannerScene[],base:SceneCopy,background:string):ResolvedScene[]{
 let copy={...base},bg=background,overlay='',layers=initialLayers(),visible=Object.fromEntries(sceneLayerKeys.map(key=>[key,key!=='overlay'])) as Record<SceneLayerKey,boolean>;
 return scenes.map(s=>{const settings=effectiveLayers(s);const next=cloneLayers(layers),show={...visible};
 for(const key of sceneLayerKeys){const setting=settings[key];if(setting.action==='keep')continue;next[key]={...setting,motion:{...setting.motion}};show[key]=setting.action!=='hide';if(setting.action==='change'){if(key==='headline'||key==='subline'||key==='cta')copy={...copy,[key]:s.copy[key]};if(key==='background')bg=setting.image||background;if(key==='overlay')overlay=setting.image||'';}}
 layers=next;visible=show;return {...s,copy:{...copy},layers:cloneLayers(layers),visible:{...visible},background:bg,overlay};
 });
}
// One DOM instance for each uninterrupted layer state; unchanged layers do not restart.
export function layerSequenceMarkup(scenes:BannerScene[],resolved:ResolvedScene[],frame:(key:SceneLayerKey,scene:ResolvedScene)=>string,{loop=false,time=0,playing=false}:{loop?:boolean;time?:number;playing?:boolean}={}){
 const total=sequenceDuration(scenes);if(!total)return '';
 const starts:number[]=[];let offset=0;for(const s of scenes){starts.push(offset);offset+=s.duration;}
 const pct=(n:number)=>`${Math.max(0,Math.min(100,n/total*100)).toFixed(6)}%`,shown='opacity:1;translate:0 0;scale:1';
 const hidden=(m:MotionSettings,exit=false)=>{const preset=exit?m.exit:m.preset;return preset==='none'?shown:`opacity:0;translate:${preset==='slide-side'?m.distance:0}px ${preset==='slide-up'?m.distance:0}px;scale:${preset==='scale'?'.94':'1'}`};
 const clock=`${total}ms linear var(--rl-sequence-delay) ${loop?'infinite':'1'} both`,rules:string[]=[],markup:string[]=[];
 for(const [order,key] of sceneLayerKeys.entries()){
  let first=0;
  while(first<scenes.length){let last=first;while(last+1<scenes.length&&effectiveLayers(scenes[last+1])[key].action==='keep')last++;
   const s=resolved[first];if(s.visible[key]){const start=starts[first],end=starts[last]+scenes[last].duration,final=last===scenes.length-1&&!loop,m=effectiveLayers(scenes[first])[key].action==='keep'?stillMotion:effectiveLayers(scenes[first])[key].motion;
    const id=`rl-sequence-layer-${order}-${first}`,exit=final?stillMotion:m;
    // All transition phases fit in the first scene; outgoing transition fits the last.
    const incomingBudget=m.delay+(m.preset==='none'?0:m.duration),outgoingBudget=exit.exit==='none'?0:exit.exitDuration;
    const budget=incomingBudget+(first===last?outgoingBudget:0),factor=budget>scenes[first].duration*.9?scenes[first].duration*.9/budget:1;
    const entry=start+m.delay*factor,entryEnd=entry+(m.preset==='none'?0:m.duration*factor),exitStart=end-Math.min(outgoingBudget*factor,scenes[last].duration*.45);
    rules.push(`@keyframes ${id}{0%{visibility:hidden;${hidden(m)}}${pct(start)}{visibility:visible;${hidden(m)}}${pct(entry)}{visibility:visible;${hidden(m)};animation-timing-function:${m.easing}}${pct(entryEnd)}{visibility:visible;${shown}}${pct(exitStart)}{visibility:visible;${shown};animation-timing-function:${m.easing}}${pct(Math.max(exitStart,end-.01))}{visibility:visible;${final?shown:hidden(exit,true)}}${pct(end)}{visibility:${final?'visible':'hidden'};${final?shown:hidden(exit,true)}}100%{visibility:${final?'visible':'hidden'};${final?shown:hidden(exit,true)}}}`);
    const body=frame(key,s);if(body)markup.push(`<div data-sequence-layer="${key}" data-scene-start="${first}" style="position:absolute;inset:0;z-index:${order===0?0:key==='overlay'?1:2};pointer-events:none;animation:${id} ${clock};animation-play-state:var(--rl-sequence-state);animation-timing-function:steps(1,end)">${body}</div>`);
   }first=last+1;
  }
 }
 return `<style>${rules.join('')}</style><div class="rl-sequence rl-layer-sequence" style="position:relative;width:100%;height:100%;overflow:hidden;--rl-sequence-delay:-${Math.max(0,Math.min(total,time))}ms;--rl-sequence-state:${playing?'running':'paused'}">${markup.join('')}</div>`;
}
