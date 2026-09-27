import {describe,expect,it} from 'vitest';
import {createPlacementPackage,placementHtml} from './mvp2Packaging.mjs';

const format={id:'fmt-300x250',width:300,height:250,size:'300×250',exportType:'html5'};
const placement=(exportType:string,extra:any={})=>({id:`p-${exportType}`,platform:'Ad Network',placement:'Homepage',width:300,height:250,creativeType:exportType,requirements:{exportType,clickTag:true,clickTagVariable:'landingClick',clickUrl:'https://example.com/landing',impressionUrl:'https://example.com/pixel',...extra}});
const artifact=(kind:string,mimeType:string,content=Buffer.from(`${kind}-bytes`))=>({kind,mimeType,content,width:300,height:250,durationSec:6,bytes:content.length});

describe('placement-specific delivery formats',()=>{
 it.each([
  ['jpg','jpg','image/jpeg','.jpg'],
  ['png','png','image/png','.png'],
  ['gif','gif','image/gif','.gif'],
  ['webp','webp','image/webp','.webp'],
  ['video','video','video/mp4','.mp4'],
 ])('packages %s as the requested raw binary',(_label,kind,mime,extension)=>{const p=placement(String(_label)),item=createPlacementPackage(format,p,{[`fmt-300x250:${kind}`]:artifact(String(kind),String(mime))});expect(item.outputType).toBe(_label);expect(item.mimeType).toBe(mime);expect(item.fileName).toMatch(new RegExp(`${extension!.replace('.','\\.')}$`));expect(item.packageBytes).toBeGreaterThan(0)});

 it('builds HTML5 + GIF with a full click area, TT variable and tracking pixel',()=>{const p=placement('html5+gif'),item=createPlacementPackage(format,p,{'fmt-300x250:gif':artifact('gif','image/gif')});expect(item.mimeType).toBe('application/zip');expect(item.files.map((file:any)=>file.name)).toEqual(['index.html','fallback.gif']);const html=String(item.files[0].content);expect(html).toContain('window.landingClick=window.landingClick||"https://example.com/landing"');expect(html).toContain('id="bm-click"');expect(html).toContain('https://example.com/pixel')});

 it('allows ad servers to inject the clickTag value when TT does not provide a fixed URL',()=>{const p=placement('html5',{clickUrl:''}),html=placementHtml({...format,previewHtml:'<b>creative</b>'},p);expect(html).toContain('window.landingClick=window.landingClick||""');expect(html).toContain('window.clickTag=window.landingClick')});
});
