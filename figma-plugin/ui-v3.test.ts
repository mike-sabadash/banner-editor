import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ui=readFileSync(new URL("./ui-v6.html",import.meta.url),"utf8");
const controller=readFileSync(new URL("./code-plan-formats.js",import.meta.url),"utf8");
const manifest=JSON.parse(readFileSync(new URL("./manifest.json",import.meta.url),"utf8"));

function compile(source:string,filename:string){
  try{
    new vm.Script(source,{filename});
  }catch(error){
    const detail=error instanceof Error?(error.stack||error.message):String(error);
    throw new Error(`Syntax check failed for ${filename}\n${detail}`);
  }
}

describe("final Figma campaign UI contract",()=>{
  it("parses the inline UI script and controller without syntax errors",()=>{
    const script=ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"";
    expect(script.length).toBeGreaterThan(100);
    expect(()=>compile(script,"ui-v6-inline.js")).not.toThrow();
    expect(()=>compile(controller,"code-plan-formats.js")).not.toThrow();
  });

  it("separates campaign setup and creative editor",()=>{
    expect(ui).toContain("Campaign Setup");
    expect(ui).toContain("Creative Editor");
  });

  it("keeps Delivery Plan, Pixel/TT and explicit canvas creation visible",()=>{
    expect(ui).toContain("Attach Media Plan / TT");
    expect(ui).toContain("Pixel / TT");
    expect(ui).toContain("Process Delivery Plan");
    expect(ui).toContain("Create formats from plan");
    expect(ui).toContain("Add ${missing.length} missing formats from plan");
  });

  it("includes local XLSX parsing and server AI fallback",()=>{
    expect(ui).toContain("async function parseXlsx(file)");
    expect(ui).toContain("DecompressionStream('deflate-raw')");
    expect(ui).toContain("/api/delivery-plan/extract");
  });

  it("keeps granular Motion inheritance controls",()=>{
    for(const part of ["motionType","timing","easing","geometry","layout"]){
      expect(ui).toContain(`data-part=\"${part}\"`);
    }
  });

  it("wires Delivery Plan formats into the Figma controller",()=>{
    expect(ui).toContain("create-from-plan");
    expect(controller).toContain("createCampaignFromFormats");
    expect(controller).toContain("plan-formats-created");
    expect(controller).toContain("format-${key}");
    expect(controller).toContain("deliveryPlacements");
    expect(controller).toContain("ttConflicts");
  });

  it("loads v6 UI/controller and permits only the campaign gateway domain",()=>{
    expect(manifest.ui).toBe("ui-v6.html");
    expect(manifest.main).toBe("code-plan-formats.js");
    expect(manifest.networkAccess.allowedDomains).toEqual(["https://banners.rechord.online"]);
  });
});
