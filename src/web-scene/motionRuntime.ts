import type {CSSProperties} from "react";
import type {MotionPreset} from "./sceneModel";

type MotionLayer={motion:MotionPreset;motionDurationMs:number;startMs:number;endMs:number;motionVector:{x:number;y:number};easing:string};

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const ease=(t:number,easing:string)=>{
  if(easing==="linear")return t;
  if(easing==="ease-in-out")return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  return 1-Math.pow(1-t,3);
};

export function motionFrame(layer:MotionLayer,localMs:number):CSSProperties{
  const duration=Math.max(1,layer.motionDurationMs||1);
  const progress=ease(clamp01((localMs-layer.startMs)/duration),layer.easing);
  const inverse=1-progress;
  let opacity=1,transform="translate3d(0,0,0) scale(1)";
  switch(layer.motion){
    case "fade": opacity=progress; break;
    case "scale-in": opacity=progress; transform=`translate3d(0,0,0) scale(${0.82+0.18*progress})`; break;
    case "from-left":case "from-right":case "from-top":case "from-bottom":
      opacity=progress;
      transform=`translate3d(${layer.motionVector.x*inverse}%,${layer.motionVector.y*inverse}%,0) scale(1)`;
      break;
    default: break;
  }
  return {opacity,transform,transformOrigin:"center",willChange:"transform, opacity"};
}

export function layerVisibleAt(layer:Pick<MotionLayer,"startMs"|"endMs">,localMs:number){return localMs>=layer.startMs&&localMs<=layer.endMs}
