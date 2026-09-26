import type {Scene,SceneLayer} from "./sceneModel";

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export const MIN_SCENE_DURATION_MS=200;
export const MAX_SCENE_DURATION_MS=60_000;

export function totalSceneDuration(scenes:Pick<Scene,"durationMs">[]){
 return scenes.reduce((sum,scene)=>sum+scene.durationMs,0);
}

export function resizeSceneDuration(scene:Scene,nextDurationMs:number):Scene{
 const durationMs=clamp(Math.round(nextDurationMs),MIN_SCENE_DURATION_MS,MAX_SCENE_DURATION_MS);
 const oldDuration=Math.max(MIN_SCENE_DURATION_MS,scene.durationMs);
 const layers=scene.layers.map((layer):SceneLayer=>{
  const followsSceneEnd=Math.abs(layer.endMs-oldDuration)<1;
  const startMs=clamp(layer.startMs,0,Math.max(0,durationMs-40));
  const endMs=clamp(followsSceneEnd?durationMs:layer.endMs,startMs+40,durationMs);
  const span=Math.max(0,endMs-startMs);
  const motionDurationMs=clamp(layer.motionDurationMs,0,span);
  const outMotionDurationMs=clamp(layer.outMotionDurationMs??0,0,Math.max(0,span-motionDurationMs));
  return {...layer,startMs,endMs,motionDurationMs,outMotionDurationMs};
 });
 return {...scene,durationMs,layers};
}
