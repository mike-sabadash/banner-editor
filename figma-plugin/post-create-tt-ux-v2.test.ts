import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const ui=fs.readFileSync(new URL('./ui-v14.html',import.meta.url),'utf8');
const code=fs.readFileSync(new URL('./code-v8.js',import.meta.url),'utf8');
describe('post-create TT manager UX',()=>{
 it('uses one format list for one, selected, all and several placements per visual size',()=>{
  for(const token of ['Assign TT directly inside each created format','+ Add placement / TT','Apply to selected','Apply to all','function mergePlacement','function applyBulk','scheduleResolve','resolvePlacement'])expect(ui).toContain(token);
  expect(ui).not.toContain('TT for created formats');
  expect(ui).not.toContain('>Match KB + add<');
 });
 it('matches Knowledge Base inline without automatically invoking paid AI',()=>{
  expect(ui).toContain('Type platform — TT Knowledge will check automatically.');
  expect(ui).toContain('no verified official TT source in Knowledge Base yet');
  const resolve=ui.slice(ui.indexOf('async function resolvePlacement'),ui.indexOf('function bindCreated'));
  const bulk=ui.slice(ui.indexOf('async function applyBulk'),ui.indexOf('function renderPlan'));
  expect(resolve).not.toContain('callAI(');
  expect(bulk).not.toContain('callAI(');
 });
 it('batch controller updates only TT metadata for existing roots',()=>{
  const fn=code.slice(code.indexOf('function updateFormatsTT'),code.indexOf('function campaignState'));
  expect(fn).toContain('deliveryPlacements');
  expect(fn).toContain('ttConflicts');
  expect(fn).not.toContain('.resize(');
  expect(fn).not.toContain('createComponent');
  expect(code).toContain('m.type==="update-formats-tt"');
 });
});
