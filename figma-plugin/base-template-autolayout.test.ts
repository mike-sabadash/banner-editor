import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('./code-v8.js',import.meta.url),'utf8');
describe('base campaign composition',()=>{
  it('uses a vertical auto-layout stack for headline and copy',()=>{
    expect(code).toContain('function addTextStack');
    expect(code).toContain('stack.layoutMode="VERTICAL"');
    expect(code).toContain('headline.textAutoResize="HEIGHT"');
    expect(code).toContain('subline.textAutoResize="HEIGHT"');
    expect(code).toContain('layoutRole","headline-copy-autolayout"');
  });
  it('uses 8px CTA radius and bottom-aligns strip CTA',()=>{
    expect(code.match(/radius:8/g)?.length||0).toBeGreaterThanOrEqual(2);
    expect(code).toContain('Math.max(c.pad,f.height-c.pad-bh)');
    expect(code).not.toContain('(f.height-bh)/2');
  });
});
