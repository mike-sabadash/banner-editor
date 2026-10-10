import type {MarketFormat} from './resizeLabFormats';
export type VisualTransform={scale:number;x:number;y:number};
export type FamilySettings={sourceId:string;image:string;visual:VisualTransform;logoRatio:number;offsets:Partial<Record<'logo'|'headline'|'subline'|'cta',{x:number;y:number}>>};
export const defaultVisual:VisualTransform={scale:1,x:0,y:0};
export function inheritOffsets(settings:FamilySettings|undefined,format:MarketFormat){
 return Object.fromEntries(Object.entries(settings?.offsets||{}).map(([key,p])=>[key,{x:p!.x*format.width,y:p!.y*format.height}]));
}
export type MotionPreset='none'|'fade'|'slide-up'|'slide-side'|'scale';
export type MotionSettings={preset:MotionPreset;duration:number;stagger:number;distance:number;easing:'ease-out'|'ease-in-out'|'cubic-bezier(0.22, 1, 0.36, 1)';exit:MotionPreset;exitDuration:number;hold:number;delay:number};
export const defaultMotion:MotionSettings={preset:'none',duration:600,stagger:150,distance:20,easing:'ease-out',exit:'none',exitDuration:500,hold:2000,delay:0};
export function motionStyle(m:MotionSettings,editing=false){
 if(editing||m.preset==='none'&&m.exit==='none')return '';
 const hidden=(preset:MotionPreset)=>preset==='slide-up'?`opacity:0;translate:0 ${m.distance}px`:preset==='slide-side'?`opacity:0;translate:${m.distance}px 0`:preset==='scale'?'opacity:0;scale:.94':'opacity:0';
 const animations=[m.preset!=='none'?`rl-motion-in ${m.duration}ms ${m.easing} both`:null,m.exit!=='none'?`rl-motion-out ${m.exitDuration}ms ${m.easing} forwards`:null].filter(Boolean).join(',');
 const delays=[m.preset!=='none'?`calc(${m.delay}ms + var(--rl-order,0) * ${m.stagger}ms)`:null,m.exit!=='none'?`calc(${m.delay+(m.preset==='none'?0:m.duration)+m.hold}ms + var(--rl-order,0) * ${m.stagger}ms)`:null].filter(Boolean).join(',');
 return `<style>@keyframes rl-motion-in{from{${hidden(m.preset)}}to{opacity:1;translate:0 0;scale:1}}@keyframes rl-motion-out{from{opacity:1;translate:0 0;scale:1}to{${hidden(m.exit)}}}.rl-auto-canvas [data-edit-layer]{animation:${animations};animation-delay:${delays}}.rl-auto-canvas [data-edit-layer="logo"]{--rl-order:0}.rl-auto-canvas [data-edit-layer="headline"]{--rl-order:1}.rl-auto-canvas [data-edit-layer="subline"]{--rl-order:2}.rl-auto-canvas [data-edit-layer="cta"]{--rl-order:3}@media(prefers-reduced-motion:reduce){.rl-auto-canvas [data-edit-layer]{animation:none!important}}</style>`;
}
