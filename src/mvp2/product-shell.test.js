import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
const product=readFileSync(new URL('./BannermaticProduct.tsx',import.meta.url),'utf8');
const viewport=readFileSync(new URL('./viewport.css',import.meta.url),'utf8');
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
 it('keeps long product workspaces reachable inside the viewport',()=>{
  expect(main).toContain('import "./mvp2/viewport.css"');
  expect(viewport).toContain('body,\n#root');
  expect(viewport).toContain('min-width: 0');
  expect(viewport).toContain('.ne-app');
  expect(viewport).toContain('height: 100dvh');
  expect(viewport).toContain('.ne-content');
  expect(viewport).toContain('overflow-y: auto');
  expect(viewport).toContain('height: calc(100dvh - 56px)');
 });
});
