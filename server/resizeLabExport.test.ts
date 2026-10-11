import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {inflateRawSync} from 'node:zlib';
import {buildResizeLabExport,clickMarkup,exportPlacementIssues} from './resizeLabExport.mjs';
function readZip(buffer:Buffer){const files:Record<string,Buffer>={};let offset=0;while(buffer.readUInt32LE(offset)===0x04034b50){const method=buffer.readUInt16LE(offset+8),size=buffer.readUInt32LE(offset+18),names=buffer.readUInt16LE(offset+26),extras=buffer.readUInt16LE(offset+28),name=buffer.subarray(offset+30,offset+30+names).toString(),start=offset+30+names+extras;const bytes=buffer.subarray(start,start+size);files[name]=method===8?inflateRawSync(bytes):bytes;offset=start+size;}return files;}
const placement=(extra:any={})=>({id:'placement-1',platform:'Custom network',placement:'Leaderboard',width:728,height:90,requirements:{maxZipKb:150,clickUrl:'https://example.com/campaign',clickTagVariable:'clickTAG',exportType:'html5'},delivery:{weightScope:'zip',clickProfile:'clickTag',quantity:1},...extra});
const doc=(image:string)=>`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><style>.canvas{width:728px;height:90px;background-image:url('${image}')}</style></head><body><div class="canvas">Headline<button>CTA</button></div></body></html>`;
async function input(){const noise=Buffer.alloc(1600*400*3);let x=987654;for(let i=0;i<noise.length;i++){x=(x*1664525+1013904223)>>>0;noise[i]=x>>>24;}const png=await sharp(noise,{raw:{width:1600,height:400,channels:3}}).png().toBuffer();return {width:728,height:90,html:doc('data:image/png;base64,'+png.toString('base64')),placements:[placement()],durationSeconds:4,loop:false,fonts:[],characters:'Headline CTA'};}
describe('size-constrained complete banner delivery',()=>{
 it('optimizes export copies to pass the actual ZIP limit, preserves HTML layers and local assets',async()=>{
  const source=await input(),original=source.html,result=await buildResizeLabExport(source),p=result.packages[0],zip=Buffer.from(p.base64,'base64'),files=readZip(zip),html=files['index.html'].toString();
  expect(zip.length).toBeLessThanOrEqual(150000);expect(p.report.checkedBytes).toBe(zip.length);expect(p.report.passed).toBe(true);expect(html).toContain('Headline');expect(html).toContain('CTA');expect(html).toContain('var clickTAG =');expect(html).toContain('width=728,height=90');expect(html).not.toContain('data:image');expect(html).not.toContain('fonts.googleapis.com');expect(files['image-0.jpg']).toBeDefined();expect(source.html).toBe(original);expect(p.report.images[0].bytes).toBeLessThan(p.report.images[0].originalBytes);
 });
 it('checks raw and HTML scopes independently instead of treating every limit as a ZIP limit',async()=>{
  const source=await input();for(const scope of ['raw','html']){const p=placement();p.delivery.weightScope=scope;const result=await buildResizeLabExport({...source,placements:[p]});const report=result.packages[0].report;expect(report.checkedBytes).toBe(scope==='raw'?report.rawBytes:report.htmlBytes);expect(report.checkedBytes).toBeLessThanOrEqual(150000);}
 });
 it('keeps alpha assets as local PNG, including an SVG logo rendered safely',async()=>{
  const svg='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><circle cx="30" cy="30" r="20" fill="red"/></svg>').toString('base64');const source=await input(),r=await buildResizeLabExport({...source,html:doc(svg)});const files=readZip(Buffer.from(r.packages[0].base64,'base64'));expect(files['image-0.png']).toBeDefined();expect((await sharp(files['image-0.png']).metadata()).hasAlpha).toBe(true);
 });
 it('packages different placement links independently for a single visual format',async()=>{
  const source=await input(),b=placement({id:'placement-2',platform:'Other network'});b.requirements={...b.requirements,clickUrl:'https://example.org/other'};const r=await buildResizeLabExport({...source,placements:[placement(),b]});expect(r.packages).toHaveLength(2);expect(r.packages[0].fileName).not.toBe(r.packages[1].fileName);const first=readZip(Buffer.from(r.packages[0].base64,'base64'))['index.html'].toString(),second=readZip(Buffer.from(r.packages[1].base64,'base64'))['index.html'].toString();expect(first).toContain('example.com/campaign');expect(second).toContain('example.org/other');
 });
 it('never passes an impossible limit or an unrecognized/external asset',async()=>{
  const source=await input(),p=placement();p.requirements.maxZipKb=.1;await expect(buildResizeLabExport({...source,placements:[p]})).rejects.toThrow('не удалось уложить');await expect(buildResizeLabExport({...source,html:doc('https://elsewhere.example/image.jpg')})).rejects.toThrow('внешние ресурсы');
 });
 it('rejects missing/invalid requirements, overlong animation and an unsafe click variable',()=>{
  const p=placement();p.requirements.clickUrl='javascript:alert(1)';p.requirements.clickTagVariable='class';p.requirements.maxDurationSec=3;expect(exportPlacementIssues(p,4)).toHaveLength(3);expect(exportPlacementIssues({...placement(),requirements:{}})).not.toHaveLength(0);
 });
 it('uses the Yandex click API and a runtime stop for bounded looping',()=>{const p=placement();p.delivery.clickProfile='yandex';const c=clickMarkup(p,728,90,30);expect(c.body).toContain('getClickURLNum(1)');expect(c.body).toContain('30000');expect(c.body).toContain('iterations:1');});
 it('includes font subsets locally with no font CDN dependency in the exported HTML',async()=>{
  const source=await input(),font=Buffer.from('wOF2mock-font-subset');let calls=0;
  const r=await buildResizeLabExport({...source,fonts:['Roboto'],characters:'export-fixture-unique'},{fetchImpl:async(url:string)=>{calls++;return url.startsWith('https://fonts.googleapis.com/')?{ok:true,text:async()=>"@font-face{font-family:'Roboto';src:url(https://fonts.gstatic.com/subset.woff2) format('woff2')}"}:{ok:true,arrayBuffer:async()=>font.buffer.slice(font.byteOffset,font.byteOffset+font.byteLength)}}});
  const files=readZip(Buffer.from(r.packages[0].base64,'base64'));expect(calls).toBe(2);expect(Object.keys(files).some(n=>n.endsWith('.woff2'))).toBe(true);expect(files['index.html'].toString()).not.toContain('fonts.gstatic.com');
 });
});

 describe('preserve resources until optimization is necessary',()=>{
  it('keeps a small original PNG byte-for-byte when its complete package already meets the budget',async()=>{const source=await input(),small=await sharp({create:{width:728,height:90,channels:3,background:'#556677'}}).png().toBuffer();const r=await buildResizeLabExport({...source,html:doc('data:image/png;base64,'+small.toString('base64'))});const files=readZip(Buffer.from(r.packages[0].base64,'base64'));expect(files['image-0.png']).toEqual(small);expect(r.packages[0].report.quality).toBeNull();});
  it('automatically reduces quality/density when the whole ZIP must fit a tighter budget',async()=>{const source=await input(),p=placement();p.requirements.maxZipKb=25;const r=await buildResizeLabExport({...source,placements:[p]});expect(Buffer.from(r.packages[0].base64,'base64').length).toBeLessThanOrEqual(25000);expect(r.packages[0].report.quality).not.toBeNull();});
 });

 describe('resource-only rewriting',()=>{it('preserves data-URL text instead of treating a headline as an image resource',async()=>{const source=await input();const html=source.html.replace('Headline','data:image/png;base64,AQID');const r=await buildResizeLabExport({...source,html});expect(readZip(Buffer.from(r.packages[0].base64,'base64'))['index.html'].toString()).toContain('data:image/png;base64,AQID');});it('rejects unsupported animated bitmap assets rather than silently skipping optimization/duration checks',async()=>{const source=await input();await expect(buildResizeLabExport({...source,html:doc('data:image/gif;base64,AQID')})).rejects.toThrow('GIF/видео');});});

 describe('export orientation',()=>{it('retains the visible EXIF orientation when recompressing a portrait camera image',async()=>{const source=await input(),raw=Buffer.from(source.html.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/)![1],'base64'),jpeg=await sharp(raw).withMetadata({orientation:6}).jpeg({quality:95}).toBuffer(),p=placement({width:160,height:600});p.requirements.maxZipKb=25;const r=await buildResizeLabExport({...source,width:160,height:600,html:doc('data:image/jpeg;base64,'+jpeg.toString('base64')),placements:[p]});const files=readZip(Buffer.from(r.packages[0].base64,'base64')),name=Object.keys(files).find(k=>k.startsWith('image-'))!,meta=await sharp(files[name]).metadata();expect(meta.height).toBeGreaterThan(meta.width!);expect(meta.orientation).toBeUndefined();expect((await sharp(jpeg).metadata()).orientation).toBe(6);});});
