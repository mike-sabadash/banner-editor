import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const ui=fs.readFileSync(new URL('./ui-v14.html',import.meta.url),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('./manifest-legacy.json',import.meta.url),'utf8'));
describe('integrated campaign format picker',()=>{
  it('keeps all primary workspaces while adding the picker',()=>{for(const id of ['setup','knowledge','creative','manual','plan'])expect(ui).toContain(`id="${id}"`);expect(ui).toContain('id="format-preset"');expect(ui).toContain('Custom size…')});
  it('orders high coverage sizes first and groups extended/special formats',()=>{expect(ui.indexOf('240,400')).toBeLessThan(ui.indexOf('300,600'));expect(ui).toContain("label:'Extended SSP formats'");expect(ui).toContain("label:'Special / premium'")});
  it('adds presets into the manual row model before campaign creation',()=>{expect(ui).toContain("$('#add-format').onclick");expect(ui).toContain('addManual(s)');expect(ui).toContain("addManual({width:'',height:''})")});
  it('switches created campaigns to unified format + TT cards',()=>{for(const token of ['Assign TT directly inside each created format','+ Add placement / TT','Apply to selected','Apply to all'])expect(ui).toContain(token)});
  it('keeps the former all-in-one UI available as an explicit legacy build',()=>expect(manifest.ui).toBe('ui-v14.html'));
});
