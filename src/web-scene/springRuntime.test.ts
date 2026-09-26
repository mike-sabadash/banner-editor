import {describe,expect,it} from "vitest";
import {animeSpringProgress,bounceProgress,springConfig,SPRING_PRESETS} from "./springRuntime";
describe("spring runtime",()=>{
 it("uses exact endpoints",()=>{const c=springConfig({preset:"drop",...SPRING_PRESETS.drop});expect(animeSpringProgress(0,700,c)).toBe(0);expect(animeSpringProgress(1,700,c)).toBe(1)});
 it("keeps presets finite while scrubbing",()=>{for(const id of ["soft","drop","single","bouncy"] as const){const c=springConfig({preset:id,...SPRING_PRESETS[id]});for(let i=0;i<=20;i++)expect(Number.isFinite(bounceProgress(i/20,700,c))).toBe(true)}});
 it("supports custom overshoot curves",()=>{const c=springConfig({preset:"custom",customCurve:[{x:0,y:0,inX:0,inY:0,outX:.2,outY:.8},{x:.6,y:1.2,inX:.45,inY:1.2,outX:.75,outY:1.2},{x:1,y:1,inX:.9,inY:1,outX:1,outY:1}]});expect(bounceProgress(.6,700,c)).toBeGreaterThan(1)});
});