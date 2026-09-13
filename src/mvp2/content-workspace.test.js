import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const content=readFileSync(new URL('./ContentWorkspace.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('./next-elite-workspaces.css',import.meta.url),'utf8');

describe('Content Matrix workspace',()=>{
 it('uses one selected variant inspector instead of stacked variant forms',()=>{
  expect(content).toContain('ne-variant-list');
  expect(content).toContain('ne-content-inspector');
  expect(content).toContain('selectedId');
  expect(content).toContain('missingFields');
  expect(content).not.toContain('vnext-content-grid');
 });
 it('keeps assignment edits on placement contentVariantIds',()=>{
  expect(content).toContain('contentVariantIds:assigned?');
  expect(content).toContain('ne-assignment-matrix');
  expect(content).toContain('aria-pressed={checked}');
  expect(content).toContain('api.updateCampaign(campaign.id,{contentVariants:items,placements})');
 });
 it('has responsive workbench and matrix styling',()=>{
  expect(styles).toContain('.ne-content-workbench');
  expect(styles).toContain('.ne-variant-list');
  expect(styles).toContain('.ne-content-inspector');
  expect(styles).toContain('.ne-assignment-matrix');
 });
});
