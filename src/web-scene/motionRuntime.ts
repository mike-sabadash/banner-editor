import type {CSSProperties} from "react";
import type {BezierCurve,BounceConfig,BounceCurve,EasingPreset,MotionPreset} from "./sceneModel";
import {bounceProgress,springConfig} from "./springRuntime";

type MotionLayer={motion:MotionPreset;motionDurationMs:number;outMotion?:MotionPreset;outMotionDurationMs?:number;startMs:number;endMs:number;motionVector:{x:number;y:number};inBounceVector?:{x:number;y:number};outBounceVector?:{x:number;y:number};easing:EasingPreset;easingBezier?:BezierCurve;outEasing?:EasingPreset;outEasingBezier?:BezierCurve;inOpacity?:boolean;outOpacity?:boolean;inBounce?:BounceConfig;outBounce?:BounceConfig;bounceIntensity?:number;bounceDirection?:"up"|"down"|"left"|"right";bouncePath?:BounceCurve;bouncePreset?:string};
const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
const curveFor=(name:EasingPreset,custom?:BezierCurve):BezierCurve=>name==="linear"?[0,0,1,1]:name==="ease-in"?[.42,0,1,1]:name==="ease-in-out"?[.42,0,.58,1]:name==="cubic-bezier"?(custom??[.25,.1,.25,1]):[0,0,.58,1];
export const cubicBezierProgress=(t:number,curve:BezierCurve)=>{
 if(t<=0)return 0;if(t>=1)return 1;
 const[x1,y1,x2,y2]=curve,safeX1=clamp01(x1),safeX2=clamp01(x2);
 const sample=(u:number,a1:number,a2:number)=>{const c=3*a1,b=3*(a2-a1)-c,a=1-c-b;return((a*u+b)*u+c)*u};
 const slope=(u:number,a1:number,a2:number)=>3*(1-3*a2+3*a1)*u*u+2*(3*a2-6*a1)*u+3*a1;
 let lo=0,hi=1,u=t;
 for(let i=0;i<8;i++){const x=sample(u,safeX1,safeX2)-t,d=slope(u,safeX1,safeX2);if(Math.abs(x)<1e-7)break;if(Math.abs(d)<1e-7)break;const next=u-x/d;if(next<=lo||next>=hi)break;u=next;if(x>0)hi=u;else lo=u}
 lo=0;hi=1;
 for(let i=0;i<28;i++){u=(lo+hi)/2;if(sample(u,safeX1,safeX2)<t)lo=u;else hi=u}
 u=(lo+hi)/2;
 return clamp01(sample(u,y1,y2));
};
const eased=(t:number,name:EasingPreset,curve?:BezierCurve)=>cubicBezierProgress(clamp01(t),curveFor(name,curve));
export function motionFrame(layer:MotionLayer,localMs:number):CSSProperties{
 const inDuration=Math.max(1,layer.motionDurationMs||1),outDuration=Math.max(1,layer.outMotionDurationMs||1);
 const inRaw=clamp01((localMs-layer.startMs)/inDuration),outStart=layer.endMs-outDuration,outRaw=clamp01((layer.endMs-localMs)/outDuration),isOut=!!layer.outMotionDurationMs&&localMs>=outStart;
 const raw=isOut?outRaw:inRaw,p=isOut?eased(raw,layer.outEasing??layer.easing,layer.outEasingBezier):eased(raw,layer.easing,layer.easingBezier);
 const legacyFade=isOut?(layer.outMotion==="fade"):(layer.motion==="fade"),fade=isOut?(!!layer.outOpacity||legacyFade):(!!layer.inOpacity||legacyFade);
 const preset:MotionPreset=isOut?(layer.outMotion==="fade"?"none":layer.outMotion??"none"):(layer.motion==="fade"?"none":layer.motion);
 const inverse=1-p;let transform="translate3d(0,0,0) scale(1)";
 if(preset==="scale-in")transform=`translate3d(0,0,0) scale(${Number((.82+.18*p).toFixed(4))})`;
 else if(preset==="bounce"){const legacyPreset=layer.bouncePreset==="soft"?"soft":layer.bouncePreset==="lively"?"bouncy":"single",config=springConfig(isOut?(layer.outBounce??{preset:legacyPreset,direction:layer.bounceDirection??"up",distance:Math.max(.05,(layer.bounceIntensity??100)/100),offscreen:false,bounce:.12,velocity:.55}):(layer.inBounce??{preset:legacyPreset,direction:layer.bounceDirection??"down",distance:Math.max(.05,(layer.bounceIntensity??100)/100),offscreen:false,bounce:.12,velocity:.55})),progress=bounceProgress(isOut?outRaw:inRaw,isOut?outDuration:inDuration,config),vector=isOut?(layer.outBounceVector??layer.motionVector):(layer.inBounceVector??layer.motionVector),factor=isOut?progress:1-progress,x=vector.x*factor,y=vector.y*factor;transform=`translate3d(${Number(x.toFixed(4))}%,${Number(y.toFixed(4))}%,0) scale(1)`}
 else if(["from-left","from-right","from-top","from-bottom"].includes(preset))transform=`translate3d(${layer.motionVector.x*inverse}%,${layer.motionVector.y*inverse}%,0) scale(1)`;
 return {opacity:fade?p:1,transform,transformOrigin:"center",willChange:"transform, opacity"};
}
export function layerVisibleAt(layer:Pick<MotionLayer,"startMs"|"endMs">,localMs:number){return localMs>=layer.startMs&&localMs<=layer.endMs}
