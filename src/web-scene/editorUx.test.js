import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const editor=readFileSync(new URL("./WebSceneEditor.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("./sceneEditor.css",import.meta.url),"utf8");
const campaignCss=readFileSync(new URL("./campaignScene.css",import.meta.url),"utf8");
const store=readFileSync(new URL("../../server/mvp2Store.mjs",import.meta.url),"utf8");

describe("professional scene editor UX",()=>{
  it("uses compact Figma-like handles and dotted workspace",()=>{
    expect(editor).toContain('"nw","n","ne","e","se","s","sw","w"');
    expect(css).toContain("radial-gradient(circle");
  });
  it("supports image replacement, drop and bleed",()=>{
    expect(editor).toContain("Add image to Hero");
    expect(editor).toContain("Drop here or click");
    expect(editor).toContain("onDrop={onDrop}");
  });
  it("supports grid and contextual snapping",()=>{
    expect(editor).toContain("snapMove");
    expect(editor).toContain(">Snap</button>");
    expect(editor).toContain("4 px");
    expect(css).toContain(".bm-guide.vertical");
  });
  it("ships a Cyrillic-friendly font library and color control",()=>{
    expect(editor).toContain('"Golos Text"');
    expect(editor).toContain('"PT Sans"');
    expect(editor).toContain('type="color"');
    expect(css).toContain("fonts.googleapis.com");
  });
  it("keeps compact TT control inside the stage controls",()=>{
    expect(editor).toContain("bm-tt-compact");
    expect(editor).toContain("bm-tt-popover");
    expect(editor).toContain("bm-stage-controls");
    expect(campaignCss).toContain(".bm-center>.bm-stage{grid-row:2;grid-column:1");
    expect(campaignCss).toContain(".bm-center>.bm-timeline{grid-row:3;grid-column:1");
  });
  it("keeps campaign index payloads free from heavy creative documents",()=>{
    expect(store).toContain("const {creativeDocument,...summary}=c");
  });
});
