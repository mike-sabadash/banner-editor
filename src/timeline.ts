import BezierEasing from "bezier-easing";

export type AnimatableProperty = "x" | "y" | "scale" | "rotation" | "opacity";
export type Easing = string;
export type Bezier = [number, number, number, number];
export type Keyframe = {
  id: string;
  time: number;
  property: AnimatableProperty;
  value: number;
  easing?: Easing;
  bezier?: Bezier;
};
export type FormatKeyframes = Record<string, Keyframe[]>;
export const upsertKeyframe = (frames: Keyframe[], frame: Keyframe) => [
  ...frames.filter((item) => !(item.property === frame.property && Math.abs(item.time - frame.time) < 0.05)),
  frame,
].sort((a,b)=>a.time-b.time);
export const moveKeyframe = (frames: Keyframe[], id: string, time: number) => frames.map((item)=>item.id===id?{...item,time:Math.max(0,Math.min(6,time))}:item).sort((a,b)=>a.time-b.time);
export const cubicBezierProgress = (value:number,[x1,y1,x2,y2]:Bezier)=>BezierEasing(x1,y1,x2,y2)(Math.max(0,Math.min(1,value)));
const bounceOut=(t:number)=>{const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d){t-=1.5/d;return n*t*t+.75}if(t<2.5/d){t-=2.25/d;return n*t*t+.9375}t-=2.625/d;return n*t*t+.984375};
const elasticOut=(t:number)=>t===0||t===1?t:Math.pow(2,-10*t)*Math.sin((t*10-.75)*(2*Math.PI/3))+1;
const spring=(t:number,bounce=.35,frequency=10)=>1-Math.exp(-6*(1-bounce*.55)*t)*Math.cos(frequency*t*(1+bounce));
export const EASING_PRESETS = [
  "linear","inQuad","outQuad","inOutQuad","inCubic","outCubic","inOutCubic","inSine","outSine","inOutSine","inExpo","outExpo","inOutExpo","inCirc","outCirc","inOutCirc","inBack","outBack","inOutBack","inElastic","outElastic","inOutElastic","inBounce","outBounce","inOutBounce","spring-default","spring-snappy","spring-bouncy","spring-strong","steps-start","steps-end","custom"
] as const;
export const easeProgress=(value:number,easing:Easing="linear",bezier:Bezier=[.42,0,.58,1])=>{
  const t=Math.max(0,Math.min(1,value));
  if(easing==="custom")return cubicBezierProgress(t,bezier);
  if(easing==="ease-in")return cubicBezierProgress(t,[.42,0,1,1]);
  if(easing==="ease-out")return cubicBezierProgress(t,[0,0,.58,1]);
  if(easing==="ease-in-out")return cubicBezierProgress(t,[.42,0,.58,1]);
  if(easing==="inQuad")return t*t;if(easing==="outQuad")return 1-(1-t)*(1-t);if(easing==="inOutQuad")return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  if(easing==="inCubic")return t*t*t;if(easing==="outCubic")return 1-Math.pow(1-t,3);if(easing==="inOutCubic")return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  if(easing==="inSine")return 1-Math.cos(t*Math.PI/2);if(easing==="outSine")return Math.sin(t*Math.PI/2);if(easing==="inOutSine")return -(Math.cos(Math.PI*t)-1)/2;
  if(easing==="inExpo")return t===0?0:Math.pow(2,10*t-10);if(easing==="outExpo")return t===1?1:1-Math.pow(2,-10*t);if(easing==="inOutExpo")return t===0||t===1?t:t<.5?Math.pow(2,20*t-10)/2:(2-Math.pow(2,-20*t+10))/2;
  if(easing==="inCirc")return 1-Math.sqrt(1-t*t);if(easing==="outCirc")return Math.sqrt(1-Math.pow(t-1,2));if(easing==="inOutCirc")return t<.5?(1-Math.sqrt(1-Math.pow(2*t,2)))/2:(Math.sqrt(1-Math.pow(-2*t+2,2))+1)/2;
  if(easing.includes("Back")){const c1=1.70158,c3=c1+1;if(easing==="inBack")return c3*t*t*t-c1*t*t;if(easing==="outBack")return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);const c2=c1*1.525;return t<.5?Math.pow(2*t,2)*((c2+1)*2*t-c2)/2:(Math.pow(2*t-2,2)*((c2+1)*(t*2-2)+c2)+2)/2}
  if(easing==="outBounce")return bounceOut(t);if(easing==="inBounce")return 1-bounceOut(1-t);if(easing==="inOutBounce")return t<.5?(1-bounceOut(1-2*t))/2:(1+bounceOut(2*t-1))/2;
  if(easing==="outElastic")return elasticOut(t);if(easing==="inElastic")return 1-elasticOut(1-t);if(easing==="inOutElastic")return t<.5?(1-elasticOut(1-2*t))/2:(1+elasticOut(2*t-1))/2;
  if(easing==="spring-default")return spring(t,.25,9);if(easing==="spring-snappy")return spring(t,.18,13);if(easing==="spring-bouncy")return spring(t,.55,11);if(easing==="spring-strong")return spring(t,.35,16);
  if(easing==="steps-start")return Math.ceil(t*6)/6;if(easing==="steps-end")return Math.floor(t*6)/6;
  return t;
};
export const interpolateValue=(baseValue:number,frames:Array<Keyframe|null|undefined>,property:AnimatableProperty,playhead:number)=>{
  const time=Number.isFinite(playhead)?Math.max(0,Math.min(6,playhead)):0;
  const valid=frames.filter((frame):frame is Keyframe=>Boolean(frame)&&frame!.property===property&&Number.isFinite(frame!.time)&&Number.isFinite(frame!.value)).sort((a,b)=>a.time-b.time);
  if(!valid.length)return baseValue;
  const first=valid[0];
  // A first key at 3s marks the beginning of motion, not an implicit animation from 0s.
  // Outside the keyed interval, motion editors hold the nearest keyed value.
  if(time<first.time)return first.value;
  let before=first;for(const f of valid){if(f.time<=time)before=f;else break}
  const after=valid.find((f)=>f.time>time);
  if(!after)return before.value;
  const span=after.time-before.time;if(span<=.0001)return after.value;
  const p=easeProgress((time-before.time)/span,after.easing,after.bezier);return before.value+(after.value-before.value)*p;
};
export const snapTimelineTime=(value:number,candidates:number[]=[],step=.1,threshold=.07)=>{if(!Number.isFinite(value))return 0;const clamped=Math.max(0,Math.min(6,value)),anchors=[0,6,...candidates],nearest=anchors.reduce((best,item)=>Math.abs(item-clamped)<Math.abs(best-clamped)?item:best,anchors[0]);return Math.abs(nearest-clamped)<=threshold?nearest:Number((Math.round(clamped/step)*step).toFixed(4))};
export const setEasingAtTime=(frames:Keyframe[],time:number,easing:Easing,bezier:Bezier)=>frames.map((frame)=>Math.abs(frame.time-time)<.055?{...frame,easing,bezier:[...bezier] as Bezier}:frame);
