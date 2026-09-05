import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const ui=fs.readFileSync(new URL('./ui-v13.html',import.meta.url),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('./manifest.json',import.meta.url),'utf8'));
describe('integrated campaign format picker',()=>{
  it('keeps all primary workspaces while adding the picker',()=>{for(const id of ['setup','knowledge','creative','manual','plan'])expect(ui).toContain(`id="${id}"`);expect(ui).toContain('id="format-preset"');expect(ui).toContain('Custom size…')});
  it('orders high coverage sizes first and groups extended/special formats',()=>{expect(ui.indexOf('240,400')).toBeLessThan(ui.indexOf('300,600'));expect(ui).toContain("label:'Extended SSP formats'");expect(ui).toContain("label:'Special / premium'")});
  it('adds presets into the existing manual row model',()=>{expect(ui).toContain("$('#add-format').onclick");expect(ui).toContain('addManual(s)');expect(ui).toContain("addManual({width:'',height:''})")});
  it('is the active Figma UI',()=>expect(manifest.ui).toBe('ui-v13.html'));
});
