import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const product=readFileSync(new URL('./BannermaticProduct.tsx',import.meta.url),'utf8');
const wall=readFileSync(new URL('./CampaignWall.tsx',import.meta.url),'utf8');
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
describe('Bannermatic customer cloud',()=>{
 it('keeps the cloud shell available as an explicit compatibility route',()=>{
  expect(main).toContain('return <BannermaticProduct/>');
  expect(main).toContain('return <CampaignSceneEditor/>');
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
  expect(wall).toContain("isLive(format)?'Live HTML':format.previewSvg?'Creative snapshot':'Not published'");
  expect(wall).toContain('Open the editor to create this format.');
  expect(wall).toContain('ne-wall-placeholder');
 });
});
