import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {FORMAT_GROUPS} from './format-catalog.js';
const code=fs.readFileSync(new URL('./code-v8.js',import.meta.url),'utf8');
describe('campaign format catalog',()=>{
 it('starts with Yandex recommended high-coverage sizes',()=>{expect(FORMAT_GROUPS[0].items).toEqual([[240,400],[300,250],[728,90]])});
 it('contains broad fixed RU display coverage without duplicates',()=>{const sizes=FORMAT_GROUPS.flatMap(g=>g.items.map(([w,h])=>`${w}x${h}`));expect(sizes.length).toBeGreaterThanOrEqual(20);expect(new Set(sizes).size).toBe(sizes.length);for(const s of ['300x600','160x600','336x280','970x250','320x50','320x100','320x480','1000x120','970x90','580x400'])expect(sizes).toContain(s)});
});
describe('responsive starter composition',()=>{
 it('uses rounded CTA and responsive visibility instead of deleting linked slots',()=>{expect(code).toContain('cornerRadius');expect(code).toContain('responsiveVisibility');expect(code).toContain('n.visible=opts.visible!==false');expect(code).not.toContain('if(c.micro)return')});
 it('has micro/tiny/strip breakpoints and tighter line height',()=>{expect(code).toContain('function compositionFor');expect(code).toContain('micro=');expect(code).toContain('tiny=');expect(code).toContain('strip=');expect(code).toContain('lineHeight')});
});
