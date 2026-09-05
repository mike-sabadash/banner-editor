import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('./code-v8.js',import.meta.url),'utf8');
describe('existing format TT apply',()=>{
 it('updates metadata for matching existing sizes before creating missing sizes',()=>{const start=code.indexOf('function updateExistingFromFormats');const end=code.indexOf('function rootTTState');const flow=code.slice(start,end);expect(flow).toContain('deliveryPlacements');expect(flow).toContain('ttConflicts');expect(flow).toContain('const updated=updateExistingFromFormats(existing,normalized)');});
 it('does not mutate Figma artwork while updating existing TT',()=>{const fn=code.slice(code.indexOf('function updateExistingFromFormats'),code.indexOf('async function createCampaignFromFormats'));expect(fn).not.toContain('resize(');expect(fn).not.toContain('remove(');expect(fn).not.toContain('createComponent(');expect(fn).not.toContain('.x=');expect(fn).not.toContain('.y=');});
});
