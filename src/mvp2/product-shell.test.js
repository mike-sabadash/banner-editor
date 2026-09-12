import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
const product=readFileSync(new URL('./BannermaticProduct.tsx',import.meta.url),'utf8');
describe('Bannermatic modular customer journey',()=>{
 it('uses the modular product shell for authenticated users',()=>{
  expect(main).toContain('return <BannermaticProduct/>');
  expect(main).toContain('mvp2-shell-legacy');
 });
 it('uses reviewed media, campaign wall and delivery workspaces',()=>{
  expect(product).toContain("from './MediaPlanWorkspace'");
  expect(product).toContain("from './CampaignWall'");
  expect(product).toContain("from './DeliveryWorkspace'");
  expect(product).toContain('<MediaPlanWorkspace');
  expect(product).toContain('<CampaignWall');
  expect(product).toContain('<DeliveryWorkspace');
 });
 it('keeps the customer journey connected to Figma without claiming runtime completion',()=>{
  expect(product).toContain("const openFigma=");
  expect(product).toContain("setScreen('creative')");
  expect(product).toContain('<FigmaConnectPanel');
  expect(product).toContain("can(role,'edit-creative')");
 });
});
