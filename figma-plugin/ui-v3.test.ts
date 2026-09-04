import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ui=readFileSync(new URL("./ui-v10.html",import.meta.url),"utf8");
const controller=readFileSync(new URL("./code-v8.js",import.meta.url),"utf8");
const gateway=readFileSync(new URL("../server/openrouterGateway.mjs",import.meta.url),"utf8");
const manifest=JSON.parse(readFileSync(new URL("./manifest.json",import.meta.url),"utf8"));

function compile(source:string,filename:string){try{new vm.Script(source,{filename});}catch(error){const detail=error instanceof Error?(error.stack||error.message):String(error);throw new Error(`Syntax check failed for ${filename}\n${detail}`)}}

describe("final Figma campaign UI contract",()=>{
  it("parses final inline UI and controller without syntax errors",()=>{const script=ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"";expect(script.length).toBeGreaterThan(100);expect(()=>compile(script,"ui-v10-inline.js")).not.toThrow();expect(()=>compile(controller,"code-v8.js")).not.toThrow()});
  it("uses a wide plugin window and never loads all pages",()=>{expect(controller).toContain("width:620");expect(controller).toContain("height:760");expect(controller).not.toContain("loadAllPagesAsync");expect(controller).not.toMatch(/figma\.on\s*\(/)});
  it("keeps ordinary focus-safe fields and never rebuilds manual UI per keystroke",()=>{expect(ui).toContain('inputmode="numeric"');expect(ui).toContain('inputmode="decimal"');expect(ui).toContain("function updateManualHead(el,i)");expect(ui).toContain("requestAnimationFrame");expect(ui).not.toContain("inp.oninput=()=>{manualRows[i][inp.dataset.k]=inp.type==='number'?+inp.value:inp.value;renderManual(i)}")});
  it("uses tri-state TT requirements",()=>{expect(ui).toContain("Unknown");expect(ui).toContain("Required");expect(ui).toContain("Not required");expect(ui).toContain("function fromTri(v)")});
  it("keeps manual setup, compact rows and technical requirements",()=>{for(const text of ["Manual setup","+ Add placement","Max ZIP, KB","Max duration, sec","clickTag requirement","Tracking pixel requirement","Impression pixel URL","Click URL","TT URL"])expect(ui).toContain(text)});
  it("groups repeated placements into one Figma format",()=>{expect(ui).toContain("function buildFormats(placements)");expect(ui).toContain("f.placements.push(p)");expect(controller).toContain("deliveryPlacements")});
  it("detects non-first-row media-plan headers",()=>{expect(ui).toContain("function findHeaderRow(rows)");expect(ui).toContain("format|size|размер");expect(ui).toContain("website|site|network|platform|площад");expect(ui).toContain("placement|размещ")});
  it("parses XLSX/DOCX locally and sends PDF only on AI action",()=>{expect(ui).toContain("async function parseXlsx(file)");expect(ui).toContain("word/document.xml");expect(ui).toContain("readAsDataURL(file)");expect(ui).toContain("DecompressionStream('deflate-raw')")});
  it("provides OpenRouter TT match and verify",()=>{expect(ui).toContain("AI TT Assistant · OpenRouter");expect(ui).toContain("Find TT with AI");expect(ui).toContain("Verify current setup with AI");expect(ui).toContain("/api/tt/analyze");expect(gateway).toContain('req.url==="/api/tt/analyze"');expect(gateway).toContain("ai_tt_analysis");expect(gateway).toContain("Never invent missing requirements")});
  it("does not expose OpenRouter key in plugin UI",()=>{expect(ui).not.toContain("OPENROUTER_API_KEY");expect(gateway).toContain("OPENROUTER_API_KEY");expect(ui).toContain("Nothing is sent until you click Find or Verify.")});
  it("avoids redundant plan rerenders and refresh after format creation",()=>{expect(ui).toContain("function updatePlanButton()");expect(ui).not.toContain("if(plan.formats.length)renderPlan()");expect(ui).not.toContain("send('refresh')}if(m.type==='action-result'")});
  it("loads Inter once per batch and reduces repeated Figma root scans",()=>{expect(controller).toContain('await figma.loadFontAsync({family:"Inter",style:"Regular"})');expect(controller).toContain("const pageRoots=allRoots()");expect(controller).toContain("slotMaps=new Map")});
  it("keeps review before explicit creation",()=>{expect(ui).toContain("Nothing has been created in Figma yet.");expect(ui).toContain("Create formats from plan");expect(controller).toContain("const missing=normalized.filter");expect(controller).toContain("skipped:normalized.length-roots.length")});
  it("keeps granular linked-format controls",()=>{for(const part of ["content","appearance","motionType","timing","easing","geometry","layout"])expect(ui).toContain(`data-part=\"${part}\"`);expect(controller).toContain("syncSlot")});
  it("loads focus-safe AI TT UI in manifest",()=>{expect(manifest.ui).toBe("ui-v10.html");expect(manifest.main).toBe("code-v8.js");expect(manifest.documentAccess).toBe("dynamic-page");expect(manifest.networkAccess.allowedDomains).toEqual(["https://banners.rechord.online"])});
});
