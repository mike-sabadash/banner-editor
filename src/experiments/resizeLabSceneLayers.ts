import {defaultMotion,restoreEasing,type MotionSettings} from './resizeLabEditing';
import {type BannerScene,type SceneCopy,sequenceDuration} from './resizeLabScenes';
export const sceneLayerKeys=['background','logo','headline','subline','cta','overlay'] as const;
export type SceneLayerKey=typeof sceneLayerKeys[number];
export type SceneAdaptation={image:string;adapted?:boolean;error?:string;visual?:import("./resizeLabEditing").VisualTransform;overrides?:Partial<Record<"logo"|"headline"|"subline"|"cta",{x:number;y:number}>>;logoWidth?:number};
export type SceneLayer={adaptations?:Record<string,SceneAdaptation>;imageName?:string;action:'keep'|'change'|'hide';image?:string;x:number;y:number;width:number;motion:MotionSettings};
export type SceneLayers=Record<SceneLayerKey,SceneLayer>;
export type ResolvedScene=BannerScene&{layers:SceneLayers;visible:Record<SceneLayerKey,boolean>;background:string;overlay:string};
export function restoreAdaptation(r:SceneAdaptation){const number=(n:unknown,f:number,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):f;return {adapted:typeof r.adapted==='boolean'?r.adapted:undefined,visual:r.visual?{scale:number(r.visual.scale,1,.25,4),x:number(r.visual.x,0,-100,100),y:number(r.visual.y,0,-100,100)}:undefined,logoWidth:typeof r.logoWidth==='number'?number(r.logoWidth,120,8,4000):undefined,overrides:r.overrides?Object.fromEntries(Object.entries(r.overrides).filter(([k])=>['logo','headline','subline','cta'].includes(k)).map(([k,v])=>[k,{x:number(v?.x,0,-4000,4000),y:number(v?.y,0,-4000,4000)}])):undefined};}
// Bottom-to-top stack. Legacy projects retain their original stack.
export function layerOrder(scene:BannerScene):SceneLayerKey[]{const order=scene.layerOrder||['background','overlay','logo','headline','subline','cta'];return [...new Set([...order,...sceneLayerKeys])] as SceneLayerKey[];}
export function sceneAdapted(result:SceneAdaptation|undefined,source:string){return !!result?.image&&(result.adapted??result.image!==source);}
export const stillMotion={...defaultMotion};
export function initialLayers():SceneLayers{return Object.fromEntries(sceneLayerKeys.map(key=>[key,{action:key==='overlay'?'hide':'keep',x:50,y:50,width:40,motion:{...stillMotion}}])) as SceneLayers;}
export function cloneLayers(layers:SceneLayers):SceneLayers{return Object.fromEntries(sceneLayerKeys.map(key=>[key,{...layers[key],motion:{...layers[key].motion},adaptations:layers[key].adaptations?Object.fromEntries(Object.entries(layers[key].adaptations!).map(([id,result])=>[id,{...result,visual:result.visual?{...result.visual}:undefined,overrides:result.overrides?Object.fromEntries(Object.entries(result.overrides).map(([k,v])=>[k,{...v}])):undefined}])):undefined}])) as SceneLayers;}
export function restoreLayers(value:unknown,motion:MotionSettings):SceneLayers|undefined{
 if(!value||typeof value!=='object')return undefined;
 const source=value as Partial<SceneLayers>,layers=initialLayers();
 for(const key of sceneLayerKeys){const s=source[key];if(!s||typeof s!=='object')continue;const safe=(n:unknown,fallback:number,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
 const validImage=(v:unknown):v is string=>typeof v==='string'&&/^(data:image\/(png|jpe?g|webp|svg\+xml);base64,|\/api\/resize-lab\/assets\/[a-f0-9]{64}\.(png|jpg|webp|svg)$)/.test(v);
 const adaptations=s.adaptations&&typeof s.adaptations==='object'?Object.fromEntries(Object.entries(s.adaptations).filter(([id,r])=>/^\d{1,4}x\d{1,4}$/.test(id)&&r&&typeof r==='object').map(([id,r])=>[id,{...restoreAdaptation(r),image:validImage(r.image)?r.image:'',error:typeof r.error==='string'?r.error.slice(0,500):undefined}])):undefined;
 const m=s.motion||motion;const presets=['none','fade','slide-up','slide-side','scale'];
 layers[key]={adaptations,imageName:typeof s.imageName==='string'?s.imageName.slice(0,120):undefined,action:['keep','change','hide'].includes(s.action)?s.action:'keep',image:typeof s.image==='string'&&(/^(data:image\/(png|jpe?g|webp|svg\+xml);base64,|\/api\/resize-lab\/assets\/[a-f0-9]{64}\.(png|jpg|webp|svg)$)/.test(s.image))?s.image:undefined,x:safe(s.x,50,0,100),y:safe(s.y,50,0,100),width:safe(s.width,40,1,100),motion:{...stillMotion,preset:presets.includes(m.preset)?m.preset:'none',exit:presets.includes(m.exit)?m.exit:'none',duration:safe(m.duration,600,100,2000),exitDuration:safe(m.exitDuration,500,100,2000),delay:safe(m.delay,0,0,10000),distance:safe(m.distance,20,0,100),easing:restoreEasing(m.easing),exitEasing:restoreEasing(m.exitEasing??m.easing)}};
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
    rules.push(`@keyframes ${id}{0%{visibility:hidden;${hidden(m)}}${pct(start)}{visibility:visible;${hidden(m)}}${pct(entry)}{visibility:visible;${hidden(m)};animation-timing-function:${m.easing}}${pct(entryEnd)}{visibility:visible;${shown}}${pct(exitStart)}{visibility:visible;${shown};animation-timing-function:${m.exitEasing??m.easing}}${pct(Math.max(exitStart,end-.01))}{visibility:visible;${final?shown:hidden(exit,true)}}${pct(end)}{visibility:${final?'visible':'hidden'};${final?shown:hidden(exit,true)}}100%{visibility:${final?'visible':'hidden'};${final?shown:hidden(exit,true)}}}`);
    rules.push(`@keyframes ${id}-stack{${resolved.map((scene,index)=>`${pct(starts[index])}{z-index:${layerOrder(scene).indexOf(key)}}`).join('')}100%{z-index:${layerOrder(resolved[resolved.length-1]).indexOf(key)}}}`);
    const body=frame(key,s);if(body)markup.push(`<div data-sequence-layer="${key}" data-scene-start="${first}" style="position:absolute;inset:0;z-index:${layerOrder(s).indexOf(key)};pointer-events:none;animation:${id} ${clock},${id}-stack ${clock};animation-play-state:var(--rl-sequence-state);animation-timing-function:steps(1,end)">${body}</div>`);
   }first=last+1;
  }
 }
 return `<style>${rules.join('')}</style><div class="rl-sequence rl-layer-sequence" style="position:relative;width:100%;height:100%;overflow:hidden;--rl-sequence-delay:-${Math.max(0,Math.min(total,time))}ms;--rl-sequence-state:${playing?'running':'paused'}">${markup.join('')}</div>`;
}
