import {describe,expect,it} from "vitest";
import type {Campaign} from "../mvp2/domain";
import {DEFAULT_SCENES} from "./sceneModel";
import {formatsFromCampaign,ttForFormat,validateScenesForTT} from "./campaignBridge";

const campaign:Campaign={id:"c1",name:"Test",status:"media-ready",locale:"ru",mediaPlanVersion:3,placements:[
 {id:"p1",platform:"Yandex",placement:"Desktop",width:300,height:250,requirements:{maxZipKb:150,maxDurationSec:15,clickTag:true,sourceLabel:"TT Yandex"}},
 {id:"p2",platform:"VK",placement:"Feed",width:300,height:250,requirements:{maxZipKb:120,maxDurationSec:10,tracking:true,legal:"18+",sourceLabel:"TT VK"}}
],formats:[{id:"fmt-300x250",width:300,height:250,size:"300×250",placementIds:["p1","p2"],creativeState:"missing",creativeVersion:0}]};

describe("campaign scene bridge",()=>{
 it("uses campaign creative formats instead of a hardcoded set",()=>{const formats=formatsFromCampaign(campaign);expect(formats).toHaveLength(1);expect(formats[0]).toMatchObject({id:"fmt-300x250",width:300,height:250,family:"rectangle"})});
 it("merges the strictest TT for a shared visual format",()=>{const tt=ttForFormat(campaign,"fmt-300x250")!;expect(tt.maxZipKb).toBe(120);expect(tt.maxDurationSec).toBe(10);expect(tt.clickTagRequired).toBe(true);expect(tt.trackingRequired).toBe(true);expect(tt.platforms).toEqual(expect.arrayContaining(["Yandex","VK"]))});
 it("checks scene duration and legal presence against TT",()=>{const tt=ttForFormat(campaign,"fmt-300x250")!;const long=DEFAULT_SCENES.map((s,i)=>i===0?{...s,durationMs:9000}:s);const result=validateScenesForTT(long,tt);expect(result.status).toBe("attention");expect(result.issues.join(" ")).toMatch(/Duration/);expect(result.notes.join(" ")).toMatch(/clickTAG/)});
});
