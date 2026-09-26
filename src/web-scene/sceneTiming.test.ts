import {describe,expect,it} from "vitest";
import {resizeSceneDuration,totalSceneDuration} from "./sceneTiming";
import type {Scene} from "./sceneModel";
import {motionVector} from "./sceneModel";

const scene:Scene={id:"one",name:"One",durationMs:1800,layers:[
 {id:"full",name:"Full",kind:"shape",role:"background",masterBox:{x:0,y:0,w:100,h:100},motion:"none",motionDurationMs:0,easing:"linear",startMs:0,endMs:1800,visible:true},
 {id:"short",name:"Short",kind:"shape",role:"graphic",masterBox:{x:0,y:0,w:20,h:20},motion:"from-left",motionDurationMs:500,outMotion:"fade",outMotionDurationMs:300,easing:"ease-out",startMs:400,endMs:1400,visible:true}
]};

describe("scene timing",()=>{
 it("derives campaign duration from every scene",()=>expect(totalSceneDuration([{durationMs:1200},{durationMs:2300},{durationMs:500}])).toBe(4000));
 it("extends layers pinned to the scene end but keeps deliberately shorter layers unchanged",()=>{
  const next=resizeSceneDuration(scene,2600);
  expect(next.durationMs).toBe(2600);
  expect(next.layers[0].endMs).toBe(2600);
  expect(next.layers[1]).toMatchObject({startMs:400,endMs:1400});
 });
 it("clamps layer and transition ranges when a scene gets shorter",()=>{
  const next=resizeSceneDuration(scene,700);
  expect(next.layers[1]).toMatchObject({startMs:400,endMs:700,motionDurationMs:300,outMotionDurationMs:0});
 });
});

describe("motion distance",()=>{
 it("maps the inspector percentage directly to directional travel",()=>{
  expect(motionVector("from-left",{x:0,y:0,w:40,h:20},7)).toEqual({x:-7,y:0});
  expect(motionVector("from-bottom",{x:0,y:0,w:40,h:20},12)).toEqual({x:0,y:12});
 });
});
