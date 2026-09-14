import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("web scene document API",()=>{
  const api=readFileSync(new URL("./mvp2Api.mjs",import.meta.url),"utf8");
  const client=readFileSync(new URL("../src/mvp2/api.ts",import.meta.url),"utf8");
  it("has a dedicated autosave endpoint that designers can use without campaign-admin PATCH access",()=>{
    expect(api).toContain('matchCampaignAction(url,"scene-document")');
    expect(api).toContain('["owner","admin","designer"]');
    expect(api).toContain('creativeDocument.scenes is required');
    expect(client).toContain('/scene-document`');
    expect(client).toContain('saveSceneDocument');
  });
});
