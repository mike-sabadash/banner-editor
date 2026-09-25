import {describe,expect,it} from "vitest";import {DEFAULT_TRANSITION,TRANSITION_PRESETS,TRANSITION_RECIPES,interpolateBox,sceneTransitionStyle,transitionProgress} from "./transitionRuntime";
describe("scene transition runtime",()=>{
 it("ships 12 presets and 6 smart recipes",()=>{expect(TRANSITION_PRESETS).toHaveLength(12);expect(TRANSITION_RECIPES).toHaveLength(6);expect(new Set([...TRANSITION_PRESETS,...TRANSITION_RECIPES].map(x=>x.id)).size).toBe(18)});
 it("starts overlap only in the transition window",()=>{expect(transitionProgress(1500,2200,{preset:"smart",durationMs:400})).toBe(0);expect(transitionProgress(2000,2200,{preset:"smart",durationMs:400})).toBeCloseTo(.5);expect(transitionProgress(2200,2200,DEFAULT_TRANSITION)).toBe(1)});
 it("interpolates shared element geometry",()=>{expect(interpolateBox({x:0,y:10,w:20,h:30},{x:50,y:30,w:40,h:50},.5)).toEqual({x:25,y:20,w:30,h:40})});
 it("product focus keeps shared product continuous and replaces headline",()=>{expect(sceneTransitionStyle("product-focus","product","out",.5,true).opacity).toBe(1);expect(sceneTransitionStyle("product-focus","headline","out",.5,false).opacity).toBeCloseTo(.5)});
 it("directional and mask presets produce actual transition transforms",()=>{expect(String(sceneTransitionStyle("push-left","graphic","in",.5).transform)).toContain("50");expect(String(sceneTransitionStyle("wipe-right","background","in",.5).clipPath)).toContain("50")});
});
