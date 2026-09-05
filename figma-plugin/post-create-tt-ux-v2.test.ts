import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const ui=fs.readFileSync(new URL('./ui-v13.html',import.meta.url),'utf8');
const code=fs.readFileSync(new URL('./code-v8.js',import.meta.url),'utf8');
describe('post-create TT manager UX',()=>{
 it('supports one format, selected formats, all formats and several placements per visual size',()=>{
  for(const token of ['TT for created formats','Match KB + add','+ Manual TT','Apply to selected','Apply to all','function mergePlacement','function applyBulkTT'])expect(ui).toContain(token);
 });
 it('matches Knowledge Base without automatically invoking paid AI',()=>{
  expect(ui).toContain('function matchKB');
  expect(ui).toContain('AI is not called automatically');
  const bulk=ui.slice(ui.indexOf('async function applyBulkTT'),ui.indexOf('function selectedParts'));
  expect(bulk).not.toContain("callAI(");
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
