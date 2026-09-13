import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
const product=readFileSync(new URL('./BannermaticProduct.tsx',import.meta.url),'utf8');
const viewport=readFileSync(new URL('./viewport.css',import.meta.url),'utf8');
const mediaPlan=readFileSync(new URL('./MediaPlanWorkspace.tsx',import.meta.url),'utf8');
const workspaces=readFileSync(new URL('./next-elite-workspaces.css',import.meta.url),'utf8');
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
  const panel=readFileSync(new URL('./FigmaConnectPanel.tsx',import.meta.url),'utf8');
  expect(panel).toContain('Continue in Figma');
  expect(panel).toContain('api.figmaStatus');
  expect(panel).toContain('same campaign');
  expect(panel).toContain('New plugin code');
  expect(panel).toContain('pair?');
 });
 it('keeps campaign lifecycle actions explicit and recoverable',()=>{
  expect(product).toContain('api.deleteCampaign');
  expect(product).toContain('renameCampaign');
  expect(product).toContain('Delete campaign?');
  expect(product).toContain('current list was preserved');
  expect(product).toContain('RefreshCcw');
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
 it('renders the media plan as an operational production grid',()=>{
  expect(mediaPlan).toContain("type CreativeFilter='all'|'ready'|'attention'|'missing'");
  expect(mediaPlan).toContain('Search media plan');
  expect(mediaPlan).toContain('Creative status filter');
  expect(mediaPlan).toContain('TT & limits');
  expect(mediaPlan).toContain('ne-plan-group');
  expect(mediaPlan).toContain('format.creativeVersion');
  expect(mediaPlan).toContain('onOpenCreative');
  expect(workspaces).toContain('.ne-plan-table');
  expect(workspaces).toContain('.ne-plan-toolbar');
 });
});
