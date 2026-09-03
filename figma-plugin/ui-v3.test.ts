import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const ui=readFileSync(new URL("./ui-v5.html",import.meta.url),"utf8");
const manifest=JSON.parse(readFileSync(new URL("./manifest.json",import.meta.url),"utf8"));

describe("final Figma campaign UI contract",()=>{
  it("parses the inline UI script without syntax errors",()=>{
    const script=ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"";
    expect(script.length).toBeGreaterThan(100);
    expect(()=>new Function(script)).not.toThrow();
  });

  it("separates campaign setup and creative editor",()=>{
    expect(ui).toContain("Campaign Setup");
    expect(ui).toContain("Creative Editor");
  });

  it("keeps Delivery Plan and Pixel/TT visible from the plugin",()=>{
    expect(ui).toContain("Attach Media Plan / TT");
    expect(ui).toContain("Pixel / TT");
    expect(ui).toContain("Process Delivery Plan");
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

  it("loads the syntax-checked UI and permits only the campaign gateway domain",()=>{
    expect(manifest.ui).toBe("ui-v5.html");
    expect(manifest.networkAccess.allowedDomains).toEqual(["https://banners.rechord.online"]);
  });
});
