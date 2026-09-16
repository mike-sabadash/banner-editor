import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const editor=readFileSync(new URL("./WebSceneEditor.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("./sceneEditor.css",import.meta.url),"utf8");
const productCss=readFileSync(new URL("./editorProductV2.css",import.meta.url),"utf8");
describe("professional scene editor UX",()=>{
 it("uses compact handles and dotted workspace",()=>{expect(editor).toContain('"nw","n","ne","e","se","s","sw","w"');expect(css).toContain("radial-gradient(circle")});
 it("renders the selected format at 1:1 CSS pixels",()=>{expect(editor).toContain('width:`${format.width}px`');expect(editor).toContain('height:`${format.height}px`');expect(productCss).toContain("max-width:none!important")});
 it("supports Space-drag panning",()=>{expect(editor).toContain('e.code==="Space"');expect(editor).toContain("beginPan");expect(editor).toContain("scrollLeft");expect(productCss).toContain(".bm-stage.space-pan")});
 it("supports delete duplicate copy and paste",()=>{expect(editor).toContain("deleteLayer");expect(editor).toContain("duplicateLayer");expect(editor).toContain('k==="c"');expect(editor).toContain('k==="v"');expect(editor).toContain('k==="d"')});
 it("supports grid and contextual snapping",()=>{expect(editor).toContain("snapMove");expect(editor).toContain(">Snap</button>");expect(editor).toContain("[1,2,4,8]")});
 it("ships Cyrillic-friendly fonts",()=>{expect(editor).toContain('"Golos Text"');expect(editor).toContain('"PT Sans"')});
});
