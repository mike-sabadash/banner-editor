import {spring} from "animejs/easings";
import type {BounceCurve} from "./sceneModel";

export type SpringPresetId="soft"|"drop"|"single"|"bouncy";
export type SpringConfig={preset:SpringPresetId|"custom";bounce:number;velocity:number;distance:number;offscreen:boolean;customCurve?:BounceCurve};
export const SPRING_PRESETS:Record<SpringPresetId,Omit<SpringConfig,"preset">>={
 soft:{bounce:-.08,velocity:0,distance:1,offscreen:false},
 drop:{bounce:.16,velocity:1.8,distance:1,offscreen:true},
 single:{bounce:.12,velocity:.55,distance:1,offscreen:false},
 bouncy:{bounce:.34,velocity:.25,distance:1,offscreen:false}
};
export const springConfig=(value?:Partial<SpringConfig>):SpringConfig=>{const preset=value?.preset??"single",base=preset==="custom"?SPRING_PRESETS.single:SPRING_PRESETS[preset];return{preset,...base,...value,bounce:Math.max(-.5,Math.min(.5,value?.bounce??base.bounce)),velocity:Math.max(-10,Math.min(10,value?.velocity??base.velocity)),distance:Math.max(.05,Math.min(4,value?.distance??base.distance))}};
export const animeSpringProgress=(t:number,duration:number,config:SpringConfig)=>{if(t<=0)return 0;if(t>=1)return 1;const ease=spring({bounce:config.bounce,duration:Math.max(10,duration),velocity:config.velocity}) as unknown as ((value:number)=>number);return ease(t)};
const cubic=(a:number,b:number,c:number,d:number,t:number)=>{const m=1-t;return m*m*m*a+3*m*m*t*b+3*m*t*t*c+t*t*t*d};
export const customCurveProgress=(t:number,path:BounceCurve)=>{if(t<=0)return path[0]?.y??0;if(t>=1)return path[path.length-1]?.y??1;for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];if(t>b.x)continue;let lo=0,hi=1;for(let n=0;n<28;n++){const u=(lo+hi)/2;if(cubic(a.x,a.outX,b.inX,b.x,u)<t)lo=u;else hi=u}const u=(lo+hi)/2;return cubic(a.y,a.outY,b.inY,b.y,u)}return 1};
export const bounceProgress=(t:number,duration:number,config:SpringConfig)=>config.preset==="custom"&&config.customCurve?.length?customCurveProgress(t,config.customCurve):animeSpringProgress(t,duration,config);
export const sampleSpring=(duration:number,config:SpringConfig,count=80)=>Array.from({length:count+1},(_,i)=>({x:i/count,y:bounceProgress(i/count,duration,config)}));
