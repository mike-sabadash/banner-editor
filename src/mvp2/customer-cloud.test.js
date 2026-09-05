import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const cloud=readFileSync(new URL('./BannermaticCloud.tsx',import.meta.url),'utf8');
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
describe('Bannermatic customer cloud',()=>{
 it('is the primary authenticated product shell',()=>{
  expect(main).toContain('return <BannermaticCloud/>');
  expect(main).toContain('params.get("view")==="mvp2-legacy"');
 });
 it('covers campaigns, media plan, creative wall, delivery and settings',()=>{
  for(const screen of ["'campaigns'","'overview'","'media'","'creative'","'delivery'","'settings'"])expect(cloud).toContain(screen);
  expect(cloud).toContain('processDeliveryInput');
  expect(cloud).toContain('compileVisualFormats');
  expect(cloud).toContain('CAMPAIGN WALL');
  expect(cloud).toContain('api.members');
  expect(cloud).toContain('api.setRole');
 });
 it('labels non-live previews as development placeholders',()=>{
  expect(cloud).toContain("f.previewUrl?'Live':'Development placeholder'");
 });
});
