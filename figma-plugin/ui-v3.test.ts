import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ui=readFileSync(new URL("./ui-v13.html",import.meta.url),"utf8");
const controller=readFileSync(new URL("./code-v8.js",import.meta.url),"utf8");
const gateway=readFileSync(new URL("../server/openrouterGateway.mjs",import.meta.url),"utf8");
const kb=readFileSync(new URL("../server/ttKnowledgeBase.mjs",import.meta.url),"utf8");
const service=readFileSync(new URL("../server/ttKnowledgeService.mjs",import.meta.url),"utf8");
const manifest=JSON.parse(readFileSync(new URL("./manifest.json",import.meta.url),"utf8"));

function compile(source:string,filename:string){try{new vm.Script(source,{filename});}catch(error){const detail=error instanceof Error?(error.stack||error.message):String(error);throw new Error(`Syntax check failed for ${filename}\n${detail}`)}}

describe("Figma campaign + TT Knowledge contract",()=>{
  it("parses UI/controller without syntax errors",()=>{const script=ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"";expect(script.length).toBeGreaterThan(100);expect(()=>compile(script,"ui-v13-inline.js")).not.toThrow();expect(()=>compile(controller,"code-v8.js")).not.toThrow()});
  it("keeps wide incremental Figma runtime",()=>{expect(controller).toContain("width:620");expect(controller).toContain("height:760");expect(controller).not.toContain("loadAllPagesAsync");expect(controller).not.toMatch(/figma\.on\s*\(/)});
  it("keeps focus-safe standard fields",()=>{expect(ui).toContain('inputmode="numeric"');expect(ui).toContain('inputmode="decimal"');expect(ui).toContain("function updateManualHead(el,i)");expect(ui).toContain("requestAnimationFrame");});
  it("keeps tri-state requirements",()=>{for(const x of ["Unknown","Required","Not required","function fromTri(v)"])expect(ui).toContain(x)});
  it("adds a dedicated TT Knowledge workspace",()=>{for(const x of ["TT Knowledge","TT Knowledge Base · 2026","Search platform, publisher, format","All statuses","Needs refresh","Refresh"])expect(ui).toContain(x)});
  it("shows source provenance and refresh metadata",()=>{for(const x of ["sourceUrl","sourceTitle","lastCheckedAt","sourceType","refreshMode"])expect(kb).toContain(x);expect(ui).toContain("checked ${esc(i.lastCheckedAt||'never')}");expect(ui).toContain("Source:")});
  it("has official seeded sources",()=>{for(const x of ["Yandex Direct","Adfox","AdRiver","Habr","hh.ru"])expect(kb).toContain(x)});
  it("refreshes one tracked source through OpenRouter without guessing",()=>{expect(gateway).toContain('/api/tt/kb/refresh');expect(service).toContain("refreshTTKnowledge");expect(service).toContain("official source");expect(service).toContain("Do not guess");expect(service).toContain("Keep unknown numeric values null")});
  it("lists KB without paid AI call",()=>{expect(gateway).toContain('/api/tt/kb');expect(gateway).toContain("listTTKnowledge()")});
  it("lets user explicitly select KB records for AI",()=>{expect(ui).toContain("kbSelected=new Set()");expect(ui).toContain("Add to AI sources");expect(ui).toContain("knowledgeIds:[...kbSelected]");expect(gateway).toContain("kbItemsAsDocuments(input.knowledgeIds||[])")});
  it("uses either uploaded TT files or KB sources for AI match/verify",()=>{expect(ui).toContain("Attach TT files or select TT Knowledge sources");expect(ui).toContain("Find TT with AI");expect(ui).toContain("Verify current setup with AI");expect(gateway).toContain('req.url==="/api/tt/analyze"')});
  it("keeps media plan and manual campaign creation",()=>{for(const x of ["Manual setup","Media plan / TT","Create campaign","Create formats from plan","function findHeaderRow(rows)","function buildFormats(placements)"])expect(ui).toContain(x)});
  it("keeps local XLSX/DOCX parsing and PDF explicit AI path",()=>{for(const x of ["async function parseXlsx(file)","word/document.xml","readAsDataURL(file)","DecompressionStream('deflate-raw')"])expect(ui).toContain(x)});
  it("does not expose OpenRouter key in UI",()=>{expect(ui).not.toContain("OPENROUTER_API_KEY");expect(gateway).toContain("OPENROUTER_API_KEY")});
  it("keeps linked-format controls",()=>{for(const part of ["content","appearance","motionType","timing","easing","geometry","layout"])expect(ui).toContain(`data-part=\"${part}\"`);expect(controller).toContain("syncSlot")});
  it("loads TT Knowledge UI in manifest",()=>{expect(manifest.ui).toBe("ui-v13.html");expect(manifest.main).toBe("code-v8.js");expect(manifest.documentAccess).toBe("dynamic-page");expect(manifest.networkAccess.allowedDomains).toEqual(["https://banners.rechord.online","https://ads.rechord.online"])});
});
