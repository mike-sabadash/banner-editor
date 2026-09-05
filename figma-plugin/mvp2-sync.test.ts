import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('./mvp2-sync-code.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('./mvp2-sync-ui.html',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('./manifest-mvp2.json',import.meta.url),'utf8'));
describe('Bannermatic Figma MVP2 sync',()=>{
 it('uses one-time pairing and scoped plugin storage instead of cloud user session token',()=>{
  expect(code).toContain('/api/figma/pair/claim');
  expect(code).toContain('figma.clientStorage.setAsync(TOKEN_KEY');
  expect(code).toContain('/api/figma/campaign');
  expect(code).not.toContain('/api/auth/login');
 });
 it('creates only missing required sizes and preserves existing campaign formats',()=>{
  expect(code).toContain('existingKeys');
  expect(code).toContain('const missing=required.filter');
  expect(code).toContain('for(const root of existing)');
  expect(ui).toContain('does not delete or overwrite your creative');
 });
 it('publishes creative through the scoped Figma endpoint',()=>{
  expect(code).toContain('/api/figma/creative-publish');
  expect(code).toContain('creativePayload');
  expect(ui).toContain('Publish Creative');
 });
 it('uses existing banner_campaign metadata namespace for compatibility',()=>{
  expect(code).toContain('const NS="banner_campaign"');
 });
 it('allows network access only to Bannermatic Cloud',()=>{
  expect(manifest.main).toBe('mvp2-sync-code.js');
  expect(manifest.ui).toBe('mvp2-sync-ui.html');
  expect(manifest.networkAccess.allowedDomains).toEqual(['https://ads.rechord.online']);
 });
});
