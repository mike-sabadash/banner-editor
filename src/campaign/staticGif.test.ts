import {describe,expect,it} from 'vitest';
import {encodeStaticGif} from '../../vendor/diffusionstudio-editor/apps/web/src/bannermatic/static-gif';
describe('Bannermatic GIF fallback encoder',()=>{it('creates a valid dimensioned GIF89a file from a rendered frame',()=>{const data=new Uint8ClampedArray(3*2*4).fill(255),gif=encodeStaticGif({width:3,height:2,data,colorSpace:'srgb'} as ImageData);expect(new TextDecoder().decode(gif.slice(0,6))).toBe('GIF89a');expect(gif[6]|gif[7]<<8).toBe(3);expect(gif[8]|gif[9]<<8).toBe(2);expect(gif.at(-1)).toBe(0x3b)})});
