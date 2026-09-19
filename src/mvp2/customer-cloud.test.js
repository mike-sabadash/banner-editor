import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const product=readFileSync(new URL('./BannermaticProduct.tsx',import.meta.url),'utf8');
const wall=readFileSync(new URL('./CampaignWall.tsx',import.meta.url),'utf8');
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
describe('Bannermatic customer cloud',()=>{
 it('uses the modular product as the primary authenticated SaaS shell',()=>{
  expect(main).toContain('return <BannermaticProduct/>');
  expect(main).toContain('params.get("view")==="mvp2-shell-legacy"');
 });
 it('covers campaigns, media plan, creative wall, delivery and settings',()=>{
  for(const screen of ["'campaigns'","'overview'","'media'","'creative'","'delivery'","'settings'"])expect(product).toContain(screen);
  expect(product).toContain('MediaPlanWorkspace');
  expect(product).toContain('CampaignWall');
  expect(product).toContain('DeliveryWorkspace');
  expect(product).toContain('api.members');
  expect(product).toContain('api.setRole');
 });
 it('keeps snapshots distinct from live HTML and exposes an explicit unpublished placeholder',()=>{
  expect(wall).toContain("isLive(format)?'Live HTML':format.previewSvg?'Figma snapshot':'Not published'");
  expect(wall).toContain('Publish from Figma to replace this placeholder.');
  expect(wall).toContain('ne-wall-placeholder');
 });
});
