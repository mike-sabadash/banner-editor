import type {CSSProperties} from "react";
import type {BezierCurve,EasingPreset,MotionPreset} from "./sceneModel";

type MotionLayer={motion:MotionPreset;motionDurationMs:number;outMotion?:MotionPreset;outMotionDurationMs?:number;startMs:number;endMs:number;motionVector:{x:number;y:number};easing:EasingPreset;easingBezier?:BezierCurve;outEasing?:EasingPreset;outEasingBezier?:BezierCurve;inOpacity?:boolean;outOpacity?:boolean};
const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
const curveFor=(name:EasingPreset,custom?:BezierCurve):BezierCurve=>name==="linear"?[0,0,1,1]:name==="ease-in"?[.42,0,1,1]:name==="ease-in-out"?[.42,0,.58,1]:name==="cubic-bezier"?(custom??[.25,.1,.25,1]):[0,0,.58,1];
export const cubicBezierProgress=(t:number,curve:BezierCurve)=>{if(t<=0)return 0;if(t>=1)return 1;const[x1,y1,x2,y2]=curve;const safeY1=clamp01(y1),safeY2=clamp01(y2),cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx,cy=3*safeY1,by=3*(safeY2-safeY1)-cy,ay=1-cy;const sampleX=(u:number)=>((ax*u+bx)*u+cx)*u;let lo=0,hi=1;for(let i=0;i<24;i++){const u=(lo+hi)/2;if(sampleX(u)<t)lo=u;else hi=u}const u=(lo+hi)/2;return ((ay*u+by)*u+cy)*u};
const eased=(t:number,name:EasingPreset,curve?:BezierCurve)=>cubicBezierProgress(clamp01(t),curveFor(name,curve));
export function motionFrame(layer:MotionLayer,localMs:number):CSSProperties{
 const inDuration=Math.max(1,layer.motionDurationMs||1),outDuration=Math.max(1,layer.outMotionDurationMs||1);
 const inRaw=clamp01((localMs-layer.startMs)/inDuration),outStart=layer.endMs-outDuration,outRaw=clamp01((layer.endMs-localMs)/outDuration),isOut=!!layer.outMotionDurationMs&&localMs>=outStart;
 const raw=isOut?outRaw:inRaw,p=isOut?eased(raw,layer.outEasing??layer.easing,layer.outEasingBezier):eased(raw,layer.easing,layer.easingBezier);
 const legacyFade=isOut?(layer.outMotion==="fade"):(layer.motion==="fade"),fade=isOut?(!!layer.outOpacity||legacyFade):(!!layer.inOpacity||legacyFade);
 const preset:MotionPreset=isOut?(layer.outMotion==="fade"?"none":layer.outMotion??"none"):(layer.motion==="fade"?"none":layer.motion);
 const inverse=1-p;let transform="translate3d(0,0,0) scale(1)";
 if(preset==="scale-in")transform=`translate3d(0,0,0) scale(${Number((.82+.18*p).toFixed(4))})`;
 else if(["from-left","from-right","from-top","from-bottom"].includes(preset))transform=`translate3d(${layer.motionVector.x*inverse}%,${layer.motionVector.y*inverse}%,0) scale(1)`;
 return {opacity:fade?p:1,transform,transformOrigin:"center",willChange:"transform, opacity"};
}
export function layerVisibleAt(layer:Pick<MotionLayer,"startMs"|"endMs">,localMs:number){return localMs>=layer.startMs&&localMs<=layer.endMs}
