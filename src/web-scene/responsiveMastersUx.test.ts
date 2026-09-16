// @ts-nocheck
import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("Responsive Masters editor UX",()=>{
 const editor=readFileSync(new URL("./WebSceneEditor.tsx",import.meta.url),"utf8");
 const preview=readFileSync(new URL("./CampaignPreview.tsx",import.meta.url),"utf8");
 const fonts=readFileSync(new URL("./CampaignFonts.tsx",import.meta.url),"utf8");
 it("keeps family-master promotion contextual",()=>{expect(editor).toContain("Use as Responsive Master");expect(editor).toContain("affected formats");expect(editor).toContain("Update family")});
 it("creates property overrides without a permanent reset console",()=>{expect(editor).toContain("setLayerOverride");expect(editor).not.toContain("INDIVIDUAL OVERRIDES")});
 it("persists v2 state while preserving creative-document fields",()=>{expect(editor).toMatch(/\.\.\.\(campaign\.creativeDocument\|\|\{\}\)/);expect(editor).toContain("responsiveMasters:responsive.responsiveMasters");expect(editor).toContain("formatOverrides:responsive.formatOverrides");expect(fonts).toContain("...(fresh.creativeDocument||")});
 it("groups preview by family and renders through responsive model",()=>{expect(preview).toContain("RESPONSIVE_FAMILY_LABELS[group.family]");expect(preview).toContain("formatInheritance(format,responsive)");expect(preview).toContain("generateScene(active,format,responsive)")});
});
