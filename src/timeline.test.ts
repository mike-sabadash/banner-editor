import {describe,expect,it} from "vitest";
import {moveKeyframe,upsertKeyframe} from "./timeline";
describe("timeline",()=>{it("replaces a property keyframe at the same time",()=>{const first={id:"1",time:1,property:"x" as const,value:10};expect(upsertKeyframe([first],{...first,id:"2",value:20})).toEqual([{...first,id:"2",value:20}])});it("clamps moved keyframes",()=>{expect(moveKeyframe([{id:"1",time:1,property:"x",value:10}],"1",9)[0].time).toBe(6)})});
