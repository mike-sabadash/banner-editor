export type AnimatableProperty="x"|"y"|"scale"|"rotation"|"opacity";
export type Keyframe={id:string;time:number;property:AnimatableProperty;value:number};
export type FormatKeyframes=Record<string,Keyframe[]>;
export const upsertKeyframe=(frames:Keyframe[],frame:Keyframe)=>[...frames.filter(item=>!(item.property===frame.property&&Math.abs(item.time-frame.time)<.05)),frame].sort((a,b)=>a.time-b.time);
export const moveKeyframe=(frames:Keyframe[],id:string,time:number)=>frames.map(item=>item.id===id?{...item,time:Math.max(0,Math.min(6,time))}:item).sort((a,b)=>a.time-b.time);
