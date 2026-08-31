export type AnimatableProperty="x"|"y"|"scale"|"rotation"|"opacity";
export type Easing="linear"|"ease-in"|"ease-out"|"ease-in-out"|"custom";
export type Bezier=[number,number,number,number];
export type Keyframe={id:string;time:number;property:AnimatableProperty;value:number;easing?:Easing;bezier?:Bezier};
export type FormatKeyframes=Record<string,Keyframe[]>;
export const upsertKeyframe=(frames:Keyframe[],frame:Keyframe)=>[...frames.filter(item=>!(item.property===frame.property&&Math.abs(item.time-frame.time)<.05)),frame].sort((a,b)=>a.time-b.time);
export const moveKeyframe=(frames:Keyframe[],id:string,time:number)=>frames.map(item=>item.id===id?{...item,time:Math.max(0,Math.min(6,time))}:item).sort((a,b)=>a.time-b.time);
const cubic=(t:number,a:number,b:number)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
export const cubicBezierProgress=(value:number,[x1,y1,x2,y2]:Bezier)=>{
 const x=Math.max(0,Math.min(1,value));let t=x;
 for(let index=0;index<6;index++){const estimate=cubic(t,x1,x2),delta=.0001,derivative=(cubic(Math.min(1,t+delta),x1,x2)-estimate)/delta;if(Math.abs(derivative)<.0001)break;t=Math.max(0,Math.min(1,t-(estimate-x)/derivative))}
 return cubic(t,y1,y2);
};
export const easeProgress=(value:number,easing:Easing="linear",bezier:Bezier=[.42,0,.58,1])=>{
 const t=Math.max(0,Math.min(1,value));
 if(easing==="custom")return cubicBezierProgress(t,bezier);
 if(easing==="ease-in")return t*t*t;
 if(easing==="ease-out")return 1-Math.pow(1-t,3);
 if(easing==="ease-in-out")return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 return t;
};
