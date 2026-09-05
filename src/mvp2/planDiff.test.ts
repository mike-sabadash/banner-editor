import {describe,expect,it} from "vitest";
import {compileVisualFormats,type Placement,type VisualFormat} from "./domain";
import {diffMediaPlan,preserveVisualsForPlan} from "./planDiff";

const placement=(overrides:Partial<Placement>):Placement=>({
 id:overrides.id||crypto.randomUUID(),
 platform:overrides.platform||"Yandex",
 placement:overrides.placement||"ROS",
 width:overrides.width||300,
 height:overrides.height||250,
 creativeType:overrides.creativeType||"HTML5",
 requirements:overrides.requirements||{maxZipKb:150,sourceLabel:"Official"},
});

describe("media plan diff",()=>{
 it("does not treat row/id changes as new placements",()=>{
  const before=[placement({id:"old"})];
  const after=[placement({id:"new"})];
  const diff=diffMediaPlan(before,after);
  expect(diff.added).toHaveLength(0);
  expect(diff.removed).toHaveLength(0);
  expect(diff.unchanged).toHaveLength(1);
 });

 it("reports added/removed formats and TT changes separately",()=>{
  const before=[placement({id:"a"}),placement({id:"b",platform:"AdRiver",width:728,height:90})];
  const after=[placement({id:"a2",requirements:{maxZipKb:120,sourceLabel:"Client TT"}}),placement({id:"c",platform:"Yandex",placement:"Mobile",width:320,height:100})];
  const diff=diffMediaPlan(before,after);
  expect(diff.changed).toHaveLength(1);
  expect(diff.changed[0].fields).toContain("requirements");
  expect(diff.added).toHaveLength(1);
  expect(diff.removed).toHaveLength(1);
  expect(diff.requiredFormatsAdded).toEqual(["320×100"]);
  expect(diff.requiredFormatsRemoved).toEqual(["728×90"]);
 });

 it("preserves creative versions for sizes that remain required",()=>{
  const beforePlacements=[placement({id:"a"})];
  const existing:VisualFormat[]=compileVisualFormats(beforePlacements).map(f=>({...f,creativeState:"published",creativeVersion:7,previewUrl:"/preview/v7"}));
  const nextPlacements=[placement({id:"new",platform:"Yandex",placement:"New ROS"})];
  const next=preserveVisualsForPlan(compileVisualFormats(nextPlacements),existing);
  expect(next[0].id).toBe(existing[0].id);
  expect(next[0].creativeState).toBe("published");
  expect(next[0].creativeVersion).toBe(7);
  expect(next[0].previewUrl).toBe("/preview/v7");
  expect(next[0].placementIds).toEqual(["new"]);
 });
});
