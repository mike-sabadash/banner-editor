import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
const product=readFileSync(new URL('./BannermaticProduct.tsx',import.meta.url),'utf8');
const wall=readFileSync(new URL('./CampaignWall.tsx',import.meta.url),'utf8');
const delivery=readFileSync(new URL('./DeliveryWorkspace.tsx',import.meta.url),'utf8');
const viewport=readFileSync(new URL('./viewport.css',import.meta.url),'utf8');
const mediaPlan=readFileSync(new URL('./MediaPlanWorkspace.tsx',import.meta.url),'utf8');
const workspaces=readFileSync(new URL('./next-elite-workspaces.css',import.meta.url),'utf8');
describe('Bannermatic modular customer journey',()=>{
 it('uses the campaign product as the primary Studio route and keeps the scene editor reachable',()=>{
  expect(main).toContain('return <BannermaticProduct/>');
  expect(main).toContain('params.get("view")==="scene-editor"');
  expect(main).toContain('return <CampaignSceneEditor/>');
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
 it('keeps the customer journey in the same campaign with the web editor as the MVP creative surface',()=>{
  expect(product).toContain("const openCreativeEditor=");
  expect(product).toContain("setScreen('creative')");
  expect(product).not.toMatch(/figma/i);
  expect(wall).toContain('FigmaImportBrowser');
  expect(wall).toContain('Import design');
  expect(delivery).not.toMatch(/figma/i);
  expect(product).not.toMatch(/FigmaImportBrowser|figmaBridge|figmaPair/i);
  expect(product).toContain("can(role,'edit-creative')");
  expect(product).toContain('view=scene-editor&campaignId=');
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
