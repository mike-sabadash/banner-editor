import type {CSSProperties} from "react";
import type {BezierCurve,BounceCurve,EasingPreset,MotionPreset} from "./sceneModel";

type MotionLayer={motion:MotionPreset;motionDurationMs:number;outMotion?:MotionPreset;outMotionDurationMs?:number;startMs:number;endMs:number;motionVector:{x:number;y:number};easing:EasingPreset;easingBezier?:BezierCurve;outEasing?:EasingPreset;outEasingBezier?:BezierCurve;inOpacity?:boolean;outOpacity?:boolean;bounceIntensity?:number;bounceBounces?:number;bounceDirection?:"up"|"down"|"left"|"right";bounceAmount?:number;bounceCurve?:BezierCurve;bouncePath?:BounceCurve;bouncePreset?:"soft"|"single"|"classic"|"lively"|"custom"};
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
export const BOUNCE_PRESETS:Record<"soft"|"single"|"classic"|"lively",BounceCurve>={
 soft:[{x:0,y:0,inX:0,inY:0,outX:.12,outY:.7},{x:1,y:1,inX:.7,inY:1,outX:1,outY:1}],
 single:[{x:0,y:0,inX:0,inY:0,outX:.08,outY:.92},{x:.58,y:1.08,inX:.42,inY:1.08,outX:.72,outY:1.08},{x:1,y:1,inX:.86,inY:1,outX:1,outY:1}],
 classic:[{x:0,y:0,inX:0,inY:0,outX:.18,outY:.72},{x:.55,y:1.18,inX:.4,inY:1.18,outX:.65,outY:1.18},{x:.78,y:.94,inX:.7,inY:.94,outX:.84,outY:.94},{x:.9,y:1.045,inX:.86,inY:1.045,outX:.94,outY:1.045},{x:1,y:1,inX:.97,inY:1,outX:1,outY:1}],
 lively:[{x:0,y:0,inX:0,inY:0,outX:.14,outY:.82},{x:.46,y:1.25,inX:.32,inY:1.25,outX:.56,outY:1.25},{x:.68,y:.88,inX:.6,inY:.88,outX:.75,outY:.88},{x:.82,y:1.08,inX:.77,inY:1.08,outX:.87,outY:1.08},{x:.92,y:.97,inX:.89,inY:.97,outX:.96,outY:.97},{x:1,y:1,inX:.98,inY:1,outX:1,outY:1}]
};
const cubic=(a:number,b:number,c:number,d:number,t:number)=>{const m=1-t;return m*m*m*a+3*m*m*t*b+3*m*t*t*c+t*t*t*d};
export const bounceCurveProgress=(t:number,path:BounceCurve)=>{if(t<=0)return path[0]?.y??0;if(t>=1)return path[path.length-1]?.y??1;for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];if(t>b.x)continue;let lo=0,hi=1,u=.5;for(let n=0;n<24;n++){u=(lo+hi)/2;if(cubic(a.x,a.outX,b.inX,b.x,u)<t)lo=u;else hi=u}return cubic(a.y,a.outY,b.inY,b.y,(lo+hi)/2)}return 1};
export function motionFrame(layer:MotionLayer,localMs:number):CSSProperties{
 const inDuration=Math.max(1,layer.motionDurationMs||1),outDuration=Math.max(1,layer.outMotionDurationMs||1);
 const inRaw=clamp01((localMs-layer.startMs)/inDuration),outStart=layer.endMs-outDuration,outRaw=clamp01((layer.endMs-localMs)/outDuration),isOut=!!layer.outMotionDurationMs&&localMs>=outStart;
 const raw=isOut?outRaw:inRaw,p=isOut?eased(raw,layer.outEasing??layer.easing,layer.outEasingBezier):eased(raw,layer.easing,layer.easingBezier);
 const legacyFade=isOut?(layer.outMotion==="fade"):(layer.motion==="fade"),fade=isOut?(!!layer.outOpacity||legacyFade):(!!layer.inOpacity||legacyFade);
 const preset:MotionPreset=isOut?(layer.outMotion==="fade"?"none":layer.outMotion??"none"):(layer.motion==="fade"?"none":layer.motion);
 const inverse=1-p;let transform="translate3d(0,0,0) scale(1)";
 if(preset==="scale-in")transform=`translate3d(0,0,0) scale(${Number((.82+.18*p).toFixed(4))})`;
 else if(preset==="bounce"){const amp=layer.bounceIntensity??14,path=layer.bouncePath??BOUNCE_PRESETS[layer.bouncePreset&&layer.bouncePreset!=="custom"?layer.bouncePreset:"single"],progress=bounceCurveProgress(isOut?outRaw:inRaw,path),d=(1-progress)*amp,dir=layer.bounceDirection??"down",x=dir==="left"?-d:dir==="right"?d:0,y=dir==="down"?-d:dir==="up"?d:0;transform=`translate3d(${Number(x.toFixed(4))}%,${Number(y.toFixed(4))}%,0) scale(1)`}
 else if(["from-left","from-right","from-top","from-bottom"].includes(preset))transform=`translate3d(${layer.motionVector.x*inverse}%,${layer.motionVector.y*inverse}%,0) scale(1)`;
 return {opacity:fade?p:1,transform,transformOrigin:"center",willChange:"transform, opacity"};
}
export function layerVisibleAt(layer:Pick<MotionLayer,"startMs"|"endMs">,localMs:number){return localMs>=layer.startMs&&localMs<=layer.endMs}
