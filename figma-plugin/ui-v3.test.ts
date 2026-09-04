import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ui=readFileSync(new URL("./ui-v9.html",import.meta.url),"utf8");
const controller=readFileSync(new URL("./code-v8.js",import.meta.url),"utf8");
const gateway=readFileSync(new URL("../server/openrouterGateway.mjs",import.meta.url),"utf8");
const manifest=JSON.parse(readFileSync(new URL("./manifest.json",import.meta.url),"utf8"));

function compile(source:string,filename:string){
  try{new vm.Script(source,{filename});}
  catch(error){const detail=error instanceof Error?(error.stack||error.message):String(error);throw new Error(`Syntax check failed for ${filename}\n${detail}`);}
}

describe("final Figma campaign UI contract",()=>{
  it("parses final inline UI and controller without syntax errors",()=>{
    const script=ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"";
    expect(script.length).toBeGreaterThan(100);
    expect(()=>compile(script,"ui-v9-inline.js")).not.toThrow();
    expect(()=>compile(controller,"code-v8.js")).not.toThrow();
  });

  it("uses a wide plugin window and never loads all Figma pages",()=>{
    expect(controller).toContain("width:620");
    expect(controller).toContain("height:760");
    expect(controller).toContain("figma.currentPage.loadAsync()");
    expect(controller).not.toContain("loadAllPagesAsync");
    expect(controller).not.toMatch(/figma\.on\s*\(/);
  });

  it("separates setup and creative editor and hides creative footer outside creative view",()=>{
    expect(ui).toContain("Campaign Setup");
    expect(ui).toContain("Creative Editor");
    expect(ui).toContain(".view#creative.on~.footer{display:block}");
  });

  it("supports compact accordion manual placements with arbitrary TT",()=>{
    expect(ui).toContain("Manual setup");
    expect(ui).toContain("+ Add placement");
    expect(ui).toContain("class=\"itemhead\"");
    expect(ui).toContain("Max ZIP, KB");
    expect(ui).toContain("Max duration, sec");
    expect(ui).toContain("clickTag requirement");
    expect(ui).toContain("Tracking pixel requirement");
    expect(ui).toContain("Impression pixel URL");
    expect(ui).toContain("Click URL");
    expect(ui).toContain("TT URL");
  });

  it("uses tri-state requirement controls instead of misleading boolean checkboxes",()=>{
    expect(ui).toContain("Unknown");
    expect(ui).toContain("Required");
    expect(ui).toContain("Not required");
    expect(ui).toContain("function fromTri(v)");
  });

  it("groups repeated placements into one unique Figma format",()=>{
    expect(ui).toContain("function buildFormats(placements)");
    expect(ui).toContain("f.placements.push(p)");
    expect(controller).toContain("existingKeys");
    expect(controller).toContain("deliveryPlacements");
  });

  it("detects media-plan headers beyond the first row and understands expected aliases",()=>{
    expect(ui).toContain("function findHeaderRow(rows)");
    expect(ui).toContain("format|size|размер");
    expect(ui).toContain("website|site|network|platform|площад");
    expect(ui).toContain("placement|размещ");
  });

  it("parses XLSX and DOCX locally and keeps PDF for explicit AI request",()=>{
    expect(ui).toContain("async function parseXlsx(file)");
    expect(ui).toContain("word/document.xml");
    expect(ui).toContain("readAsDataURL(file)");
    expect(ui).toContain("DecompressionStream('deflate-raw')");
  });

  it("provides OpenRouter AI TT matching and verification",()=>{
    expect(ui).toContain("AI TT Assistant · OpenRouter");
    expect(ui).toContain("Find TT with AI");
    expect(ui).toContain("Verify current setup with AI");
    expect(ui).toContain("/api/tt/analyze");
    expect(gateway).toContain('req.url==="/api/tt/analyze"');
    expect(gateway).toContain("ai_tt_analysis");
    expect(gateway).toContain("Never invent missing requirements");
  });

  it("keeps AI key server-side and sends files only on explicit AI action",()=>{
    expect(ui).not.toContain("OPENROUTER_API_KEY");
    expect(gateway).toContain("OPENROUTER_API_KEY");
    expect(ui).toContain("Nothing is sent until you click Find or Verify.");
  });

  it("keeps review before explicit Figma creation",()=>{
    expect(ui).toContain("Nothing has been created in Figma yet.");
    expect(ui).toContain("Create formats from plan");
    expect(controller).toContain("const missing=normalized.filter");
    expect(controller).toContain("skipped:normalized.length-roots.length");
  });

  it("retains technical metadata and tracking slot per Figma format",()=>{
    expect(controller).toContain("deliveryPlacements:JSON.stringify");
    expect(controller).toContain("ttConflicts:JSON.stringify");
    expect(controller).toContain("addTrackingPixel(r)");
    expect(controller).toContain("technicalRole");
  });

  it("keeps granular linked-format controls",()=>{
    for(const part of ["content","appearance","motionType","timing","easing","geometry","layout"]){expect(ui).toContain(`data-part=\"${part}\"`);}
    expect(controller).toContain("syncSlot");
  });

  it("loads AI TT UI in manifest",()=>{
    expect(manifest.ui).toBe("ui-v9.html");
    expect(manifest.main).toBe("code-v8.js");
    expect(manifest.documentAccess).toBe("dynamic-page");
    expect(manifest.networkAccess.allowedDomains).toEqual(["https://banners.rechord.online"]);
  });
});
