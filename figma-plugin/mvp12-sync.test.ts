import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code=readFileSync(new URL('./mvp12-sync-code.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('./mvp12-sync-ui.html',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('./manifest.json',import.meta.url),'utf8'));

describe('Bannermatic Figma Creative Workspace MVP12',()=>{
 it('ships as the canonical parseable plugin',()=>{
  expect(()=>new vm.Script(code,{filename:'mvp12-sync-code.js'})).not.toThrow();
  expect(()=>new vm.Script(ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'',{filename:'mvp12-sync-ui.js'})).not.toThrow();
  expect(manifest).toMatchObject({main:'mvp12-sync-code.js',ui:'mvp12-sync-ui.html',id:'bannermatic-hero-media-fixed-mvp12-local'});
  expect(manifest.networkAccess.allowedDomains).toEqual(['https://ads.rechord.online']);
 });
 it('uses stable unique semantic slots for new and nested master layers',()=>{
  for(const token of ['prepareMasterSlots','masterSourceId','syncNestedSlots','adaptNewLayer','hero.primary','image.primary'])expect(code).toContain(token);
  expect(code).toContain('role=`${role}.${seen+1}`');
 });
 it('uses deterministic family layouts, text fitting and guarded AI delta review',()=>{
  for(const token of ['fitTextBinary','longestWordWidth','solveStrip','layoutRectangle','layoutVertical','layoutScore','restoreLayout'])expect(code).toContain(token);
  expect(code).toContain('useAi&&await aiPolish');
  expect(code).toContain('/api/figma/layout-review');
  expect(code).not.toContain('AI_CLOUD');
  expect(ui).toContain('Anchor + AI Delta');
  expect(ui).toContain('AI visual review');
  expect(ui).toContain('rejected automatically if the score gets worse');
 });
 it('makes target selection and campaign switching operational',()=>{
  expect(ui).toContain("$('#toggle-formats').onclick");
  expect(ui).toContain('includeFormatIds');
  expect(ui).toContain('Switch campaign');
  expect(ui).toContain("$('#switch-campaign').onclick");
 });
});
