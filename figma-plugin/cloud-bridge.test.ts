import {describe,expect,it} from "vitest";
import {creativePublishPayload,creativePublishUrl,figmaSpecUrl,formatsFromCloudSpec,missingCloudFormats} from "./cloud-bridge.js";

describe("Figma cloud bridge",()=>{
 it("builds stable campaign endpoints",()=>{
  expect(figmaSpecUrl("cmp 1","https://cloud.example/")) .toBe("https://cloud.example/api/campaigns/cmp%201/figma-spec");
  expect(creativePublishUrl("cmp-1","https://cloud.example")) .toBe("https://cloud.example/api/campaigns/cmp-1/creative-publish");
 });

 it("converts cloud spec to plugin format requests",()=>{
  const spec={formats:[{formatId:"fmt-300x250",width:300,height:250,placementIds:["p1","p2"]},{formatId:"fmt-728x90",width:728,height:90,placementIds:["p3"]}]};
  const formats=formatsFromCloudSpec(spec);
  expect(formats[0]).toMatchObject({id:"fmt-300x250",width:300,height:250,placements:[{id:"p1"},{id:"p2"}]});
  expect(formats).toHaveLength(2);
 });

 it("returns only formats missing from the current Figma campaign",()=>{
  const spec={formats:[{formatId:"a",width:300,height:250},{formatId:"b",width:728,height:90}]};
  const missing=missingCloudFormats(spec,[{width:300,height:250}]);
  expect(missing.map(x=>x.id)).toEqual(["b"]);
 });

 it("creates a constrained creative publish payload",()=>{
  const payload=creativePublishPayload([{formatId:"fmt-1",previewUrl:"/v4",durationSec:6,estimatedZipKb:128,width:300,height:250,placementIds:["p1"]}]);
  expect(payload).toEqual({formats:[{formatId:"fmt-1",previewUrl:"/v4",previewType:"html",durationSec:6,estimatedZipKb:128}]});
 });
});
