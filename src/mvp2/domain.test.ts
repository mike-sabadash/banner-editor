import {describe,expect,it} from "vitest";
import {campaignReadiness,can,compileVisualFormats,formatRequirementBadges,physicalExportSize,type AssetSource,type Campaign,type CreativeDocument,type FormatSpec,type Placement} from "./domain";

const placements:Placement[]=[
 {id:"a",platform:"Yandex",placement:"ROS",width:300,height:250,requirements:{maxZipKb:150}},
 {id:"b",platform:"AdRiver",placement:"ROS",width:300,height:250,requirements:{maxZipKb:150}},
 {id:"c",platform:"Yandex",placement:"Top",width:728,height:90,requirements:{maxDurationSec:15}},
];

describe("Bannermatic MVP2 campaign compiler domain",()=>{
 it("deduplicates equal visual sizes while preserving placements",()=>{
  const formats=compileVisualFormats(placements);
  expect(formats).toHaveLength(2);
  const rect=formats.find(f=>f.size==="300×250");
  expect(rect?.placementIds).toEqual(["a","b"]);
 });
 it("preserves existing creative state when a media plan is recompiled",()=>{
  const first=compileVisualFormats(placements).map(f=>f.size==="300×250"?{...f,creativeState:"published" as const,creativeVersion:7}:f);
  const next=compileVisualFormats([...placements,{id:"d",platform:"Mail.ru",placement:"Homepage",width:300,height:250,requirements:{}}],first);
  const rect=next.find(f=>f.size==="300×250");
  expect(rect?.creativeState).toBe("published");
  expect(rect?.creativeVersion).toBe(7);
  expect(rect?.placementIds).toEqual(["a","b","d"]);
 });
 it("does not treat missing creative as delivery ready",()=>{
  const formats=compileVisualFormats(placements);
  const campaign:Campaign={id:"x",name:"X",status:"draft",placements,formats,locale:"en"};
  expect(campaignReadiness(campaign).blocked).toBe(3);
 });
 it("enforces role capabilities in the domain layer",()=>{
  expect(can("designer","edit-creative")).toBe(true);
  expect(can("designer","deliver")).toBe(false);
  expect(can("producer","edit-campaign")).toBe(true);
  expect(can("viewer","edit-creative")).toBe(false);
  expect(can("owner","manage-access")).toBe(true);
 });
 it("keeps Phase 0 bridge fields additive for legacy creative documents",()=>{const legacy:CreativeDocument={version:2,masterFormat:{width:300,height:600},scenes:[]};expect(legacy.assets).toBeUndefined();const spec:FormatSpec={id:"300x250",width:300,height:250};expect(spec.exportScale).toBeUndefined();const asset:AssetSource={id:"a",origin:"figma",storageUrl:"/assets/a.png",vector:false,figma:{fileKey:"f",nodeId:"1:2",nodeName:"Hero"}};const enriched:CreativeDocument={...legacy,assets:{a:asset}};expect(JSON.parse(JSON.stringify(enriched)).assets.a.figma.nodeId).toBe("1:2")});
 it("preserves optional Phase 0 format metadata when media plan is recompiled",()=>{const first=compileVisualFormats(placements).map(f=>f.size==="300×250"?{...f,exportScale:2 as const,exportScaleSource:"manual" as const,maxBytes:150000,exportType:"png" as const,requirementsSource:"TT-42"}:f);const next=compileVisualFormats(placements,first);expect(next.find(f=>f.size==="300×250")).toMatchObject({exportScale:2,maxBytes:150000,exportType:"png",requirementsSource:"TT-42"})});
 it("defaults export requirements to @1x HTML5",()=>{const result=compileVisualFormats(placements);expect(result.every(f=>f.exportScale===1)).toBe(true);expect(result.every(f=>f.exportType==="html5")).toBe(true);expect(result.every(f=>f.exportScaleSource==="media-plan")).toBe(true)});
 it("compiles strict media-plan scale, type and weight into the shared visual format",()=>{const ps=placements.map((p,i)=>i===0?{...p,requirements:{...p.requirements,exportScale:2 as const,exportType:"png" as const,maxZipKb:150}}:p);const format=compileVisualFormats(ps).find(f=>f.size==="300×250")!;expect(format).toMatchObject({exportScale:2,exportType:"png",maxBytes:150000,exportScaleSource:"media-plan"});expect(formatRequirementBadges(format)).toEqual(["@2x","≤150KB","PNG"])});
 it("keeps logical canvas size separate from @2x physical export size",()=>{const format={width:200,height:300,exportScale:2 as const};expect(format).toEqual({width:200,height:300,exportScale:2});expect(physicalExportSize(format)).toEqual({width:400,height:600,scale:2})});
 it("preserves explicit manual scale override when media plan recompiles",()=>{const initial=compileVisualFormats(placements).map(f=>f.size==="300×250"?{...f,exportScale:2 as const,exportScaleSource:"manual" as const}:f);const next=compileVisualFormats(placements,initial).find(f=>f.size==="300×250")!;expect(next.exportScale).toBe(2);expect(next.exportScaleSource).toBe("manual")});
});
