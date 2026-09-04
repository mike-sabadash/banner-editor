import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ui=readFileSync(new URL("./ui-v8.html",import.meta.url),"utf8");
const controller=readFileSync(new URL("./code-v8.js",import.meta.url),"utf8");
const manifest=JSON.parse(readFileSync(new URL("./manifest.json",import.meta.url),"utf8"));

function compile(source:string,filename:string){
  try{new vm.Script(source,{filename});}
  catch(error){const detail=error instanceof Error?(error.stack||error.message):String(error);throw new Error(`Syntax check failed for ${filename}\n${detail}`);}
}

describe("final Figma campaign UI contract",()=>{
  it("parses final inline UI and controller without syntax errors",()=>{
    const script=ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"";
    expect(script.length).toBeGreaterThan(100);
    expect(()=>compile(script,"ui-v8-inline.js")).not.toThrow();
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
    expect(ui).toContain("clickTag");
    expect(ui).toContain("Tracking pixel");
    expect(ui).toContain("Impression pixel URL");
    expect(ui).toContain("Click URL");
    expect(ui).toContain("TT URL");
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

  it("parses XLSX locally and keeps review before explicit creation",()=>{
    expect(ui).toContain("async function parseXlsx(file)");
    expect(ui).toContain("DecompressionStream('deflate-raw')");
    expect(ui).toContain("Nothing has been created in Figma yet.");
    expect(ui).toContain("Create formats from plan");
  });

  it("prevents duplicate sizes while allowing missing formats to be added",()=>{
    expect(controller).toContain("const missing=normalized.filter");
    expect(controller).toContain("skipped:normalized.length-roots.length");
    expect(ui).toContain("Add ${missing.length} missing formats");
  });

  it("retains technical metadata and tracking slot per Figma format",()=>{
    expect(controller).toContain("deliveryPlacements:JSON.stringify");
    expect(controller).toContain("ttConflicts:JSON.stringify");
    expect(controller).toContain("addTrackingPixel(r)");
    expect(controller).toContain("technicalRole");
  });

  it("keeps granular linked-format controls",()=>{
    for(const part of ["content","appearance","motionType","timing","easing","geometry","layout"]){
      expect(ui).toContain(`data-part=\"${part}\"`);
    }
    expect(controller).toContain("syncSlot");
  });

  it("loads final files in manifest",()=>{
    expect(manifest.ui).toBe("ui-v8.html");
    expect(manifest.main).toBe("code-v8.js");
    expect(manifest.documentAccess).toBe("dynamic-page");
    expect(manifest.networkAccess.allowedDomains).toEqual(["https://banners.rechord.online"]);
  });
});
