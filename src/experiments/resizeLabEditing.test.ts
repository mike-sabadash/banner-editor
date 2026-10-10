import {describe,it,expect} from 'vitest';
import {defaultMotion,inheritOffsets,motionStyle,type FamilySettings} from './resizeLabEditing';
import {marketFormats} from './resizeLabFormats';
describe('family editing',()=>{
 it('scales positive and negative family offsets to target dimensions',()=>{const family:FamilySettings={sourceId:'300x250',image:'x',visual:{scale:1.5,x:-10,y:5},logoRatio:.2,offsets:{logo:{x:-.04,y:.1},headline:{x:.1,y:0}}};const format=marketFormats.find(f=>f.id==='728x90')!;expect(inheritOffsets(family,format).logo).toEqual({x:-29.12,y:9});expect(inheritOffsets(family,format).headline.x).toBeCloseTo(72.8);});
 it('supports legacy projects with no family settings',()=>expect(inheritOffsets(undefined,marketFormats[0])).toEqual({}));
});
describe('entrance hold exit',()=>{
 it('starts exit after entrance, hold and per-layer stagger without replacing manual transform',()=>{const css=motionStyle({...defaultMotion,preset:'slide-up',exit:'fade',delay:400,hold:2500});expect(css).toContain('rl-motion-in 600ms');expect(css).toContain('rl-motion-out 500ms');expect(css).toContain('calc(3500ms + var(--rl-order,0) * 150ms)');expect(css).not.toContain('transform:');});
 it('supports exit without an entrance',()=>{const css=motionStyle({...defaultMotion,exit:'scale'});expect(css).not.toContain('animation:rl-motion-in');expect(css).toContain('calc(2000ms');});
 it('keeps all layers visible during editing and honors reduced motion',()=>{expect(motionStyle({...defaultMotion,preset:'fade',exit:'fade'},true)).toBe('');expect(motionStyle({...defaultMotion,preset:'fade'})).toContain('prefers-reduced-motion');});
});
