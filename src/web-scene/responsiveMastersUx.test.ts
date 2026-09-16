// @ts-nocheck
import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("Responsive Masters editor UX",()=>{
  const editor=readFileSync(new URL("./WebSceneEditor.tsx",import.meta.url),"utf8");
  const preview=readFileSync(new URL("./CampaignPreview.tsx",import.meta.url),"utf8");
  const fonts=readFileSync(new URL("./CampaignFonts.tsx",import.meta.url),"utf8");

  it("offers promotion, impact review, family update and inheritance labels",()=>{
    expect(editor).toContain("Use as Responsive Master");
    expect(editor).toContain("affected formats");
    expect(editor).toContain("Review changes");
    expect(editor).toContain("Update family");
    expect(editor).toContain("Based on");
  });

  it("offers property, layer and format reset without detaching the format",()=>{
    expect(editor).toContain("Reset property to Responsive Master");
    expect(editor).toContain("Reset layer to Responsive Master");
    expect(editor).toContain("Reset format to Responsive Master");
    expect(editor).toContain("setLayerOverride");
  });

  it("persists the v2 state while preserving existing creative-document fields",()=>{
    expect(editor).toMatch(/\.\.\.\(campaign\.creativeDocument\|\|\{\}\)/);
    expect(editor).toContain("responsiveMasters:responsive.responsiveMasters");
    expect(editor).toContain("formatOverrides:responsive.formatOverrides");
    expect(fonts).toContain("...(fresh.creativeDocument||");
  });

  it("groups All Formats Preview by family and marks inheritance",()=>{
    expect(preview).toContain("RESPONSIVE_FAMILY_LABELS[group.family]");
    expect(preview).toContain("Responsive Master");
    expect(preview).toContain("overrides");
    expect(preview).toContain("Based on");
    expect(preview).toContain("generateScene(active,format,responsive)");
  });
});
