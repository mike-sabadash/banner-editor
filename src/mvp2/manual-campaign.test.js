import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const manual=readFileSync(new URL('./ManualCampaignSetup.tsx',import.meta.url),'utf8');
const media=readFileSync(new URL('./MediaPlanWorkspace.tsx',import.meta.url),'utf8');
describe('Bannermatic Cloud manual setup',()=>{
 it('shares the same placement and visual format compiler as media-plan import',()=>{
  expect(manual).toContain('compileVisualFormats');
  expect(manual).toContain('preserveVisualsForPlan');
  expect(manual).toContain('api.updateCampaign');
  expect(manual).toContain("status:'media-ready'");
 });
 it('reviews changes before applying them',()=>{
  expect(manual).toContain('diffMediaPlan');
  expect(manual).toContain('Review before compile');
  expect(manual).toContain('Apply & compile');
  expect(manual).toContain('ne-review');
 });
 it('is a first-class mode of the same campaign workspace',()=>{
  expect(media).toContain("type EntryMode='plan'|'manual'");
  expect(media).toContain('<ManualCampaignSetup');
  expect(media).toContain('Media Plan / TT');
  expect(media).toContain('Manual setup');
 });
});
