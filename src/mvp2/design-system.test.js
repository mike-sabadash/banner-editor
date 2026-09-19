import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('./design-system.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../main.tsx',import.meta.url),'utf8');
describe('Bannermatic design system',()=>{
 it('defines shared visual tokens',()=>{
  for(const token of ['--bm-font-sans','--bm-space-6','--bm-radius-md','--bm-brand','--bm-success','--bm-focus','--bm-ease','--bm-container'])expect(css).toContain(token);
 });
 it('defines reusable interactive primitives and states',()=>{
  for(const selector of ['.bm-primary','.bm-secondary','.bm-ghost','.bm-field','.bm-input','.bm-select','.bm-textarea','.bm-surface'])expect(css).toContain(selector);
  expect(css).toContain(':focus-visible');expect(css).toContain('button:disabled');
 });
 it('loads before product-specific cloud and marketing CSS',()=>{
  expect(main.indexOf('./mvp2/design-system.css')).toBeLessThan(main.indexOf('./mvp2/cloud.css'));
  expect(main.indexOf('./mvp2/design-system.css')).toBeLessThan(main.indexOf('./mvp2/marketing.css'));
 });
});
