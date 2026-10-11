import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {zipFiles} from './mvp2Packaging.mjs';
const digest=value=>createHash('sha256').update(value).digest('hex');
const script=value=>JSON.stringify(String(value)).replace(/</g,'\\u003c');
const slug=value=>String(value||'placement').replace(/[^a-zA-Z0-9_-]/g,'-').replace(/-+/g,'-').slice(0,60)||'placement';
const fontCache=new Map();
const imageReference=/((?:src\s*=\s*["']|url\(\s*['"]?))(data:image\/([a-z0-9.+-]+);base64,[A-Za-z0-9+/=]+)/gi;
const replaceImage=(html,url,name)=>html.replace(imageReference,(whole,prefix,value)=>value===url?prefix+name:whole);
const reserved=new Set('var let const class function return if else for while switch case default new delete void null true false this import export await yield super window document'.split(' '));
export function exportPlacementIssues(p,duration=0){const r=p?.requirements||{},d=p?.delivery||{},issues=[];if(!p?.id||!p.platform||!p.placement)issues.push('Укажите площадку и размещение');if(!(r.maxZipKb>0&&Number.isFinite(r.maxZipKb)))issues.push('Укажите лимит КБ');if(!['zip','raw','html'].includes(d.weightScope))issues.push('Укажите объект лимита');if(!['clickTag','yandex','link'].includes(d.clickProfile))issues.push('Укажите профиль перехода');if(!/^https?:\/\/[^\s]+$/i.test(r.clickUrl||''))issues.push('Нужна HTTP(S) ссылка');const variable=r.clickTagVariable||'clickTag';if(d.clickProfile==='clickTag'&&(!/^[A-Za-z_$][\w$]*$/.test(variable)||reserved.has(variable)))issues.push('Некорректное имя clickTag');if(r.exportType&&r.exportType!=='html5')issues.push('Поддерживается HTML5');if(r.maxDurationSec!=null&&(!Number.isFinite(r.maxDurationSec)||r.maxDurationSec<=0||duration>r.maxDurationSec+.001))issues.push('Анимация превышает допустимую длительность');return issues;}
async function fetchFonts(fonts,characters,fetchImpl){
 const text=[...new Set(characters)].join('');if(text.length>1200)throw Error('Слишком большой набор символов для font subset');
 const resources=[],css=[];const seen=new Map();
 for(const font of [...new Set(fonts)]){
  if(!/^[A-Za-z0-9 ]{1,60}$/.test(font))throw Error('Недопустимое имя шрифта');
  const key=font+'|'+text;
  if(!fontCache.has(key)&&fontCache.size>=64)fontCache.delete(fontCache.keys().next().value);
  if(!fontCache.has(key))fontCache.set(key,(async()=>{
   let response=await fetchImpl('https://fonts.googleapis.com/css2?family='+encodeURIComponent(font+':wght@400;500;600;700;800')+'&text='+encodeURIComponent(text||' '),{headers:{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},redirect:'error',signal:AbortSignal.timeout(15000)});
   if(!response.ok)response=await fetchImpl('https://fonts.googleapis.com/css2?family='+encodeURIComponent(font)+'&text='+encodeURIComponent(text||' '),{headers:{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'},redirect:'error',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('Не удалось получить шрифт '+font);
   const original=await response.text();if(original.length>100_000)throw Error('Слишком большой CSS шрифта');const files=[];
   for(const match of original.matchAll(/url\(['"]?(https:\/\/[^)'"\s]+)['"]?\)/g)){if(files.some(f=>f.url===match[1]))continue;const url=new URL(match[1]);if(url.hostname!=='fonts.gstatic.com')throw Error('Недопустимый источник шрифта');const r=await fetchImpl(url.href,{redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Не удалось загрузить font subset');const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>1_000_000)throw Error('Слишком большой файл шрифта');files.push({url:match[1],bytes});}
   if(!files.length)throw Error('Нет файлов шрифта '+font);return {css:original,files};
  })().catch(e=>{fontCache.delete(key);throw e;}));
  const entry=await fontCache.get(key);let localCss=entry.css;
  for(const file of entry.files){const hash=digest(file.bytes);if(!seen.has(hash)){const ext=file.bytes.toString('ascii',0,4)==='wOF2'?'woff2':file.bytes.toString('ascii',0,4)==='wOFF'?'woff':'ttf';const name='font-'+hash.slice(0,16)+'.'+ext;seen.set(hash,name);resources.push({name,content:file.bytes});}localCss=localCss.split(file.url).join(seen.get(hash));}css.push(localCss);
 }
 return {files:resources,css:css.join('\n')};
}
export function clickMarkup(placement,width,height,stopSeconds){
 const r=placement.requirements,d=placement.delivery,variable=r.clickTagVariable||'clickTag';
 const head=d.clickProfile==='clickTag'?`<script>var ${variable} = ${script(r.clickUrl)};<\/script>`:'';
 const get=d.clickProfile==='yandex'?`window.yandexHTML5BannerApi ? yandexHTML5BannerApi.getClickURLNum(1) : ${script(r.clickUrl)}`:d.clickProfile==='clickTag'?`window[${script(variable)}]`:script(r.clickUrl);
 const stop=stopSeconds?`setTimeout(function(){if(document.getAnimations)document.getAnimations().forEach(function(a){try{a.effect.updateTiming({iterations:1});a.finish()}catch(e){a.pause()}})},${Math.round(stopSeconds*1000)});`:'';
 return {head:`<meta name="ad.size" content="width=${width},height=${height}">${head}`,body:`<a id="bm-click" aria-label="Реклама" target="_blank" rel="noopener" href="#" style="position:fixed;inset:0;z-index:2147483647"></a><script>var area=document.getElementById('bm-click');area.onclick=function(e){e.preventDefault();var url=${get};if(/^https?:\\/\\//i.test(url))window.open(url,'_blank','noopener')};${stop}<\/script>`};
}
export async function buildResizeLabExport(input,{fetchImpl=fetch}={}){
 const width=Number(input.width),height=Number(input.height),duration=Number(input.durationSeconds)||0;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>8192||height>8192||width*height>32_000_000)throw Error('Некорректные размеры экспорта');
 if(typeof input.html!=='string'||input.html.length>22_000_000||!Array.isArray(input.placements)||!input.placements.length||input.placements.length>40)throw Error('Некорректные данные экспорта');
 for(const p of input.placements){if(p.width!==width||p.height!==height)throw Error('Размер размещения не совпадает с форматом');const issues=exportPlacementIssues(p,duration);if(issues.length)throw Error(p.platform+': '+issues.join('; '));}
 let html=input.html.replace(/<link\b[^>]*>/gi,'');const refs=[...html.matchAll(imageReference)];if(refs.some(r=>!['png','jpg','jpeg','webp','svg+xml'].includes(r[3].toLowerCase())))throw Error('Экспорт изображений поддерживает PNG, JPEG, WebP и SVG; GIF/видео требуют отдельного выходного типа');const images=[...new Set(refs.map(r=>r[2]))];if(images.length>60)throw Error('Слишком много изображений');
 const sources=[];for(const url of images){const bytes=Buffer.from(url.split(',')[1],'base64');const decoder=sharp(bytes,{limitInputPixels:40_000_000});const metadata=await decoder.metadata(),stats=await decoder.stats();const swap=[5,6,7,8].includes(metadata.orientation);const oriented=swap?{...metadata,width:metadata.height,height:metadata.width}:metadata;sources.push({url,bytes,metadata:oriented,opaque:stats.isOpaque,variants:new Map()});}
 if(/(?:src|href)\s*=\s*["'](?:https?:|blob:|\/api\/)|url\(\s*['"]?(?:https?:|blob:|\/api\/)/i.test(html))throw Error('В экспорте остались внешние ресурсы. Результат не выдан.');
 const fonts=await fetchFonts(Array.isArray(input.fonts)?input.fonts:[],String(input.characters||''),fetchImpl);const packages=[];
 for(const placement of input.placements){if(placement.delivery.clickProfile==='yandex'&&sources.length+1>20)throw Error(placement.platform+': профиль Yandex допускает не более 20 файлов; уменьшите число изображений или используйте подготовленный атлас');let result;
  for(const scale of [0,2,1,.85,.7]){for(const quality of (scale===0?[100]:[90,82,74,66,58])){
   let document=html;const files=[];const changes=[];
   for(let i=0;i<sources.length;i++){const item=sources[i],m=item.metadata;const density=Math.min(1,(scale===0?1:Math.max(width/m.width,height/m.height)*scale));const w=Math.max(1,Math.round(m.width*density)),h=Math.max(1,Math.round(m.height*density));const pipeline=sharp(item.bytes,{limitInputPixels:40_000_000}).rotate().resize(w,h,{fit:'inside',withoutEnlargement:true});const cacheKey=scale+'-'+quality;let variant=item.variants.get(cacheKey);if(!variant){let content,ext;if(scale===0&&['jpeg','png'].includes(m.format)){content=item.bytes;ext=m.format==='jpeg'?'.jpg':'.png';}else if(item.opaque){const jpg=await pipeline.clone().removeAlpha().jpeg({quality,mozjpeg:true}).toBuffer();const pngKey='png-'+scale;let png=item.variants.get(pngKey);if(!png){png=await pipeline.clone().removeAlpha().png({compressionLevel:9}).toBuffer();item.variants.set(pngKey,png);}content=jpg.length<png.length?jpg:png;ext=jpg.length<png.length?'.jpg':'.png';}else{content=await pipeline.png({compressionLevel:9,palette:true,quality:Math.max(quality,80)}).toBuffer();ext='.png';}variant={content,ext};item.variants.set(cacheKey,variant);}const {content,ext}=variant;const name='image-'+i+ext;document=replaceImage(document,item.url,name);files.push({name,content});changes.push({name,originalBytes:item.bytes.length,bytes:content.length,width:w,height:h,quality:scale===0&&['jpeg','png'].includes(m.format)?null:item.opaque&&ext==='.png'?100:item.opaque?quality:Math.max(quality,80)});}
   let fontCss=fonts.css;
   if(placement.delivery.clickProfile==='yandex'){for(const file of fonts.files)fontCss=fontCss.split(file.name).join('data:font/'+file.name.split('.').at(-1)+';base64,'+file.content.toString('base64'));}else files.push(...fonts.files);
   const stop=placement.requirements.maxDurationSec&&input.loop?placement.requirements.maxDurationSec:0,click=clickMarkup(placement,width,height,stop);
   document=document.replace('</head>',click.head+`<style>${fontCss}\nhtml,body{width:${width}px;height:${height}px;margin:0;min-height:0;overflow:hidden;display:block;background:transparent}</style></head>`).replace('</body>',click.body+'</body>');
   const htmlBytes=Buffer.byteLength(document);files.unshift({name:'index.html',content:Buffer.from(document)});const rawBytes=files.reduce((n,f)=>n+f.content.length,0),zip=zipFiles(files),zipBytes=zip.length,limitBytes=Math.floor(placement.requirements.maxZipKb*1000),scope=placement.delivery.weightScope,checked=scope==='raw'?rawBytes:scope==='html'?htmlBytes:zipBytes;
   const yandex=placement.delivery.clickProfile==='yandex';if(checked<=limitBytes&&(!yandex||htmlBytes<150_000&&zipBytes<=512_000&&files.length<=20)){
    result={placementId:placement.id,platform:placement.platform,placement:placement.placement,formatId:width+'x'+height,fileName:width+'x'+height+'-'+slug(placement.platform)+'-'+slug(placement.placement)+'-'+digest(placement.id).slice(0,6)+'.zip',base64:zip.toString('base64'),report:{passed:true,weightScope:scope,limitBytes,checkedBytes:checked,zipBytes,rawBytes,htmlBytes,files:files.map(f=>({name:f.name,bytes:f.content.length})),images:changes,scale:scale===0?null:scale,quality:scale===0?null:quality,clickProfile:placement.delivery.clickProfile,clickTagVariable:placement.requirements.clickTagVariable||'clickTag',clickUrl:placement.requirements.clickUrl,quantity:placement.delivery.quantity,sourceUrl:placement.requirements.sourceUrl||'',durationSeconds:duration,stopSeconds:stop}};break;
   }
  }if(result)break;}
  if(!result)throw Error(`${placement.platform} · ${width}x${height}: не удалось уложить полный пакет в ${placement.requirements.maxZipKb} КБ без снижения качества ниже допустимого. Уточните лимит или уменьшите число/сложность изображений.`);
  packages.push(result);
 }
 return {formatId:width+'x'+height,packages};
}
