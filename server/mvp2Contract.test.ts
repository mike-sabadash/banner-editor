import {describe,expect,it} from "vitest";
import {applyCreativePublish,figmaSpecFromCampaign} from "./mvp2Contract.mjs";

const campaign:any={
 id:"cmp-1",name:"Launch",status:"creative",mediaPlanVersion:2,ttSnapshotVersion:4,creativeVersion:7,
 formats:[
  {id:"fmt-300x250",width:300,height:250,size:"300×250",placementIds:["p1","p2"],creativeState:"draft",creativeVersion:3},
  {id:"fmt-728x90",width:728,height:90,size:"728×90",placementIds:["p3"],creativeState:"published",creativeVersion:5,previewUrl:"/old"},
 ],
};

describe("MVP2 Figma/Cloud contract",()=>{
 it("exposes only stable campaign/format specification fields to Figma",()=>{
  const spec=figmaSpecFromCampaign(campaign);
  expect(spec.campaignId).toBe("cmp-1");
  expect(spec.mediaPlanVersion).toBe(2);
  expect(spec.formats).toEqual([
   {formatId:"fmt-300x250",width:300,height:250,size:"300×250",placementIds:["p1","p2"],creativeState:"draft",creativeVersion:3},
   {formatId:"fmt-728x90",width:728,height:90,size:"728×90",placementIds:["p3"],creativeState:"published",creativeVersion:5},
  ]);
 });

 it("publishes only matching formats without changing their placement geometry",()=>{
  const result=applyCreativePublish(campaign,{formats:[{formatId:"fmt-300x250",previewUrl:"/preview/v4",previewSvg:'<svg viewBox="0 0 300 250"></svg>',durationSec:6,estimatedZipKb:128}]});
  const updated=result.patch.formats[0];
  expect(result.touched).toEqual(["fmt-300x250"]);
  expect(updated.width).toBe(300);
  expect(updated.height).toBe(250);
  expect(updated.placementIds).toEqual(["p1","p2"]);
  expect(updated.creativeState).toBe("published");
  expect(updated.creativeVersion).toBe(4);
  expect(updated.previewUrl).toBe("/preview/v4");
  expect(updated.previewSvg).toContain('<svg');
  expect(result.patch.creativeVersion).toBe(8);
  expect(result.patch.status).toBe("compliance");
 });

 it("prefers a self-contained HTML publication as the live preview representation",()=>{
  const html='<!doctype html><html><body><div id="ad">Live</div><script>addEventListener("message",()=>{})</script></body></html>';
  const result=applyCreativePublish(campaign,{formats:[{formatId:"fmt-300x250",previewHtml:html,previewSvg:'<svg></svg>',previewType:'figma-svg',durationSec:6}]});
  const updated=result.patch.formats[0];
  expect(updated.previewHtml).toContain('<!doctype html>');
  expect(updated.previewType).toBe('html');
  expect(updated.previewSvg).toBe('<svg></svg>');
 });

 it("rejects publish requests that do not match campaign formats",()=>{
  expect(()=>applyCreativePublish(campaign,{formats:[{formatId:"missing"}]})).toThrow("No matching campaign formats to publish");
 });
});
