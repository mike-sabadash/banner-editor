// @ts-nocheck
import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("all-formats preview scrolling",()=>{
 const css=readFileSync(new URL("../web-scene/editorProductV2.css",import.meta.url),"utf8");
 const preview=readFileSync(new URL("../web-scene/CampaignPreview.tsx",import.meta.url),"utf8");
 it("owns both-axis scrolling for real-size formats",()=>{expect(css).toMatch(/\.bm-campaign-wall\{[^}]*height:100vh[^}]*overflow:auto/);expect(css).toContain(".bm-campaign-wall-grid{display:flex")});
 it("does not cap or scale preview frames",()=>{expect(css).toContain("max-width:none");expect(css).toContain("max-height:none");expect(preview).toContain('width:`${format.width}px`');expect(preview).toContain('height:`${format.height}px`')});
});
