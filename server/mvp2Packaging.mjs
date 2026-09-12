import {deflateRawSync} from 'node:zlib';
const esc = value => String(value||'').replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
const script = value => JSON.stringify(String(value||'')).replace(/</g,'\\u003c');
export function placementHtml(format,placement){
 const creative=format?.previewHtml||format?.previewSvg||'';if(!creative)return '';
 const body=format.previewHtml?`<iframe id="creative" sandbox="allow-scripts" srcdoc="${esc(format.previewHtml)}"></iframe>`:`<div id="creative">${format.previewSvg}</div>`;
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="ad.size" content="width=${placement.width},height=${placement.height}"><style>html,body,#creative{margin:0;width:100%;height:100%;overflow:hidden}iframe{border:0;display:block}#bm-click{position:fixed;inset:0;z-index:2147483647}</style></head><body>${body}<a id="bm-click" aria-label="Advertisement" target="_blank" rel="noopener"></a><script>window.clickTag=${script(placement.requirements?.clickUrl)};const a=document.getElementById('bm-click');a.onclick=function(e){e.preventDefault();if(/^https?:\\/\\//i.test(window.clickTag))window.open(window.clickTag,'_blank','noopener')};a.href=window.clickTag||'#';const imp=${script(placement.requirements?.impressionUrl)};if(imp){const i=new Image(1,1);i.src=imp;document.body.appendChild(i)}<\/script></body></html>`;
}
function crc32(bytes){let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^(n&1?0xedb88320:0)}return (n^0xffffffff)>>>0}
/** Standard ZIP, fixed DOS epoch, UTF-8 names, no filesystem writes. */
export function zipFiles(files){
 const local=[],central=[];let offset=0;
 for(const f of files){
  if(!f.name||f.name.startsWith('/')||f.name.split('/').some(p=>p==='..'||!p)||f.name.includes('\\'))throw new Error('Unsafe package path');
  const name=Buffer.from(f.name),raw=Buffer.isBuffer(f.content)?f.content:Buffer.from(f.content),data=deflateRawSync(raw,{level:9}),crc=crc32(raw);
  const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(8,8);h.writeUInt16LE(33,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(data.length,18);h.writeUInt32LE(raw.length,22);h.writeUInt16LE(name.length,26);
  local.push(h,name,data);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);h.copy(c,6,4,30);c.writeUInt32LE(offset,42);central.push(c,name);offset+=h.length+name.length+data.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...local,directory,end]);
}
export function placementZip(format,placement){const html=placementHtml(format,placement);return html?zipFiles([{name:'index.html',content:html}]):null}
export function campaignZip(build){
 if(build.state!=='ready'||!build.placements.length)throw Object.assign(new Error('Build is not ready for delivery'),{status:409});
 const files=build.placements.map((p,i)=>({name:`${String(i+1).padStart(3,'0')}-${String(p.platform||'placement').replace(/[^a-z0-9_-]/gi,'-')}-${p.width}x${p.height}.zip`,content:zipFiles(p.files)}));
 files.push({name:'manifest.json',content:JSON.stringify({id:build.id,campaignId:build.campaignId,pins:build.pins,placements:build.placements.map((p,i)=>({placementId:p.placementId,package:files[i].name,bytes:p.packageBytes}))},null,2)});
 return zipFiles(files);
}
