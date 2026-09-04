import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ui=readFileSync(new URL("./ui-v7.html",import.meta.url),"utf8");
const controller=readFileSync(new URL("./code-plan-formats.js",import.meta.url),"utf8");
const manifest=JSON.parse(readFileSync(new URL("./manifest.json",import.meta.url),"utf8"));

function compile(source:string,filename:string){
  try{new vm.Script(source,{filename});}
  catch(error){const detail=error instanceof Error?(error.stack||error.message):String(error);throw new Error(`Syntax check failed for ${filename}\n${detail}`);}
}

describe("final Figma campaign UI contract",()=>{
  it("parses the inline UI script and controller without syntax errors",()=>{
    const script=ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"";
    expect(script.length).toBeGreaterThan(100);
    expect(()=>compile(script,"ui-v7-inline.js")).not.toThrow();
    expect(()=>compile(controller,"code-plan-formats.js")).not.toThrow();
  });

  it("separates campaign setup and creative editor",()=>{
    expect(ui).toContain("Campaign Setup");
    expect(ui).toContain("Creative Editor");
  });

  it("supports manual campaign creation with arbitrary formats and TT",()=>{
    expect(ui).toContain("Manual setup");
    expect(ui).toContain("+ Add format / placement");
    expect(ui).toContain("Max ZIP, KB");
    expect(ui).toContain("Max duration, sec");
    expect(ui).toContain("clickTag");
    expect(ui).toContain("Tracking pixel");
    expect(ui).toContain("Impression pixel URL");
    expect(ui).toContain("Click URL");
    expect(ui).toContain("TT URL");
    expect(ui).toContain("function manualFormats()");
  });

  it("keeps Delivery Plan and explicit canvas creation",()=>{
    expect(ui).toContain("Media plan / TT");
    expect(ui).toContain("Process Delivery Plan");
    expect(ui).toContain("Create formats from plan");
    expect(ui).toContain("Add ${missing.length} missing formats from plan");
  });

  it("detects a header row anywhere in a media plan",()=>{
    expect(ui).toContain("function findHeaderRow(rows)");
    expect(ui).toContain("format|size|размер");
    expect(ui).toContain("website|site|network|platform|площад");
  });

  it("includes local XLSX parsing and server AI fallback",()=>{
    expect(ui).toContain("async function parseXlsx(file)");
    expect(ui).toContain("DecompressionStream('deflate-raw')");
    expect(ui).toContain("/api/delivery-plan/extract");
  });

  it("keeps granular Motion inheritance controls",()=>{
    for(const part of ["motionType","timing","easing","geometry","layout"]){expect(ui).toContain(`data-part=\"${part}\"`);}
  });

  it("wires both manual and parsed formats into one Figma controller",()=>{
    expect(ui).toContain("create-from-plan");
    expect(controller).toContain("createCampaignFromFormats");
    expect(controller).toContain("plan-formats-created");
    expect(controller).toContain("deliveryPlacements");
    expect(controller).toContain("ttConflicts");
  });

  it("does not register figma.on listeners in incremental runtime",()=>{
    expect(manifest.documentAccess).toBe("dynamic-page");
    expect(controller).not.toMatch(/figma\.on\s*\(/);
  });

  it("loads v7 UI/controller and permits only the campaign gateway domain",()=>{
    expect(manifest.ui).toBe("ui-v7.html");
    expect(manifest.main).toBe("code-plan-formats.js");
    expect(manifest.networkAccess.allowedDomains).toEqual(["https://banners.rechord.online"]);
  });
});
