import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('./code-v8.js',import.meta.url),'utf8');
describe('Figma post-create TT controller contract',()=>{
 it('returns existing formats with placement and TT state',()=>{expect(code).toContain('formats,tt:{ready:');expect(code).toContain('deliveryPlacements')});
 it('accepts TT metadata updates without recreating a format',()=>{expect(code).toContain('m.type==="update-format-tt"');expect(code).toContain('function updateFormatTT(');expect(code).not.toContain('update-format-tt"){const result=await createCampaignFromFormats')});
 it('persists only TT placement/conflict metadata in updateFormatTT',()=>{const fn=code.slice(code.indexOf('function updateFormatTT('),code.indexOf('function campaignState()'));expect(fn).toContain('deliveryPlacements');expect(fn).toContain('ttConflicts');expect(fn).not.toContain('resize(');expect(fn).not.toContain('createComponent(');expect(fn).not.toContain('remove(')});
});
