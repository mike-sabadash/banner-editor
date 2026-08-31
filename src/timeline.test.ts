import {describe,expect,it} from "vitest";
import {easeProgress,moveKeyframe,upsertKeyframe} from "./timeline";
describe("timeline",()=>{
 it("replaces a property keyframe at the same time",()=>{const first={id:"1",time:1,property:"x" as const,value:10};expect(upsertKeyframe([first],{...first,id:"2",value:20})).toEqual([{...first,id:"2",value:20}])});
 it("clamps moved keyframes",()=>{expect(moveKeyframe([{id:"1",time:1,property:"x",value:10}],"1",9)[0].time).toBe(6)});
 it("keeps linear progress unchanged",()=>expect(easeProgress(.25,"linear")).toBe(.25));
 it("applies distinct easing curves",()=>{expect(easeProgress(.25,"ease-in")).toBeLessThan(.25);expect(easeProgress(.25,"ease-out")).toBeGreaterThan(.25);expect(easeProgress(.5,"ease-in-out")).toBe(.5)});
 it("applies a custom cubic bezier",()=>expect(easeProgress(.25,"custom",[.42,0,1,1])).toBeLessThan(.25));
});
