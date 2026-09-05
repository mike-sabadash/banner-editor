import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const ui=fs.readFileSync(new URL('./ui-v14.html',import.meta.url),'utf8');
describe('ui v14 regressions',()=>{
  it('keeps DOCX client TT parsing',()=>{
    expect(ui).toContain("word/document.xml");
    expect(ui).toContain("ext==='docx'");
  });
  it('keeps PDF AI uploads and export download',()=>{
    expect(ui).toContain("readAsDataURL(d.file)");
    expect(ui).toContain("m.type==='export-result'");
    expect(ui).toContain("a.download='banner-campaign.json'");
  });
});
