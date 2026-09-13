import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('./mvp2-sync-code.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('./mvp2-sync-ui.html',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('./manifest-mvp2.json',import.meta.url),'utf8'));
const canonicalManifest=JSON.parse(readFileSync(new URL('./manifest.json',import.meta.url),'utf8'));
describe('Bannermatic Figma MVP2 sync',()=>{
 it('parses the current plugin controller and UI script',()=>{
  expect(()=>new vm.Script(code,{filename:'mvp2-sync-code.js'})).not.toThrow();
  const script=ui.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
  expect(()=>new vm.Script(script,{filename:'mvp2-sync-ui.js'})).not.toThrow();
 });
 it('uses one-time pairing and scoped plugin storage instead of cloud user session token',()=>{
  expect(code).toContain('/api/figma/pair/claim');
  expect(code).toContain('figma.clientStorage.setAsync(TOKEN_KEY');
  expect(code).toContain('/api/figma/campaign');
  expect(code).not.toContain('/api/auth/login');
 });
 it('creates only missing required sizes and preserves existing campaign formats',()=>{
  expect(code).toContain('matches.set(format.formatId,root)');
  expect(code).toContain('const missing=required.filter');
  expect(code).toContain('extras:existing.filter');
  expect(ui).toContain('Add missing formats only reconciles Cloud sizes');
 });
 it('makes master-to-resize content and Motion sync explicit',()=>{
  for(const token of ['pin-source','creative-sync','syncFromPinnedSource','applyManualKeyframeTrack','Local layout and unchecked properties preserved'])expect(code).toContain(token);
  for(const token of ['MASTER → RESIZES','Use selected layer','All formats','Same family','Selected','Content','Motion','Timing','Easing','Layout/size'])expect(ui).toContain(token);
  expect(ui).toContain('Selected properties will be replaced');
  expect(ui).toContain('No missing formats');
 });
 it('makes the same-campaign continuation and required formats visible in the plugin',()=>{
  expect(code).toContain('campaignId:connection.spec.campaignId');
  expect(code).toContain('formats:connection.spec.formats||[]');
  expect(ui).toContain('SAME CAMPAIGN · FIGMA WORKSPACE');
  expect(ui).toContain('Continue in Figma');
  expect(ui).toContain('Publish to Cloud');
  expect(ui).toContain('format-list');
 });
 it('publishes creative through the scoped Figma endpoint with snapshot and live HTML representation',()=>{
  expect(code).toContain('/api/figma/creative-publish');
  expect(code).toContain('creativePayload');
  expect(code).toContain('format:"SVG_STRING"');
  expect(code).toContain('previewSvg');
  expect(code).toContain('previewHtml');
  expect(code).toContain('semanticRole');
  expect(code).toContain('variantRenders');
  expect(code).toContain('animatedHtml');
  expect(code).toContain('easingFunctionCubicBezier');
  expect(code).toContain('el.animate(d.frames');
  expect(code).toContain('publicationRoots');
  expect(code).toContain('connection.spec.contentVariants');
  expect(code).toContain('bannermatic:play');
  expect(code).toContain('bannermatic:pause');
  expect(ui).toContain('Publish to Cloud');
 });
 it('uses existing banner_campaign metadata namespace for compatibility',()=>{expect(code).toContain('const NS="banner_campaign"')});
 it('allows network access only to Bannermatic Cloud',()=>{
  expect(manifest.main).toBe('mvp2-sync-code.js');expect(manifest.ui).toBe('mvp2-sync-ui.html');expect(manifest.networkAccess.allowedDomains).toEqual(['https://ads.rechord.online']);
  expect(canonicalManifest).toEqual(manifest);
 });
});
