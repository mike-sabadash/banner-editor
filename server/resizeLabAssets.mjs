import {promises as fs} from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import sharp from 'sharp';

const prefix='/api/resize-lab/assets/';
const assetName=/^[a-f0-9]{64}\.(png|jpg|webp|svg)$/;
const types={png:'image/png',jpg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml'};
export async function externalizeProjectImages(state,dir){
 const seen=new Map();
 async function visit(value){
  if(typeof value==='string'){
   const match=value.match(/^data:image\/(png|jpe?g|webp|svg\+xml);base64,([A-Za-z0-9+/=\s]+)$/);
   if(!match)return value;
   if(!seen.has(value))seen.set(value,(async()=>{
    const bytes=Buffer.from(match[2],'base64');
    const ext=match[1].startsWith('jp')?'jpg':match[1]==='svg+xml'?'svg':match[1];
    const name=createHash('sha256').update(bytes).digest('hex')+'.'+ext;
    await fs.mkdir(dir,{recursive:true});
    // Atomic immutable creation. Never replace or delete the original asset.
    const file=path.join(dir,name);try{await fs.access(file);}catch(error){if(error.code!=='ENOENT')throw error;const tmp=file+'.'+randomUUID()+'.tmp';try{await fs.writeFile(tmp,bytes,{mode:0o600});try{await fs.link(tmp,file);}catch(e){if(e.code!=='EEXIST')throw e;}}finally{await fs.unlink(tmp).catch(()=>{});}}
    return prefix+name;
   })());
   return seen.get(value);
  }
  if(Array.isArray(value))return Promise.all(value.map(visit));
  if(value&&typeof value==='object')return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await visit(v)])));
  return value;
 }
 return visit(state);
}
const pending=new Map();
export async function serveProjectAsset(req,res,url,dir){
 const name=url.pathname.slice(prefix.length);
 if(!assetName.test(name)){res.writeHead(404);res.end();return;}
 const requestedWidth=Number(url.searchParams.get('w')),requestedHeight=Number(url.searchParams.get('h'));
 const preview=requestedWidth>0&&requestedHeight>0&&!name.endsWith('.svg');
 if(preview&&(!Number.isInteger(requestedWidth)||!Number.isInteger(requestedHeight)||requestedWidth>4096||requestedHeight>4096)){res.writeHead(400);res.end();return;}
 const width=requestedWidth,height=requestedHeight;
 const tag='"'+name+(preview?`-${width}x${height}-webp90-v1`:'')+'"';
 res.setHeader('Cache-Control','private, max-age=31536000, immutable');
 res.setHeader('Vary','Origin, Authorization');res.setHeader('ETag',tag);
 res.setHeader('X-Content-Type-Options','nosniff');
 // Authentication must have happened before entering this function.
 try{
  await fs.access(path.join(dir,name));
  if(req.headers['if-none-match']===tag){res.writeHead(304);res.end();return;}
  let bytes;
  if(preview){
   const output=path.join(dir,`${name}-${width}x${height}-webp90-v1.webp`);
   try{bytes=await fs.readFile(output);}catch(error){
    if(error.code!=='ENOENT')throw error;
    if(!pending.has(output))pending.set(output,(async()=>{
     const original=await fs.readFile(path.join(dir,name));
     const metadata=await sharp(original,{limitInputPixels:40_000_000}).metadata();
     // Preserve the whole original aspect ratio; crop remains a canvas operation.
     const scale=Math.min(Math.max(width/metadata.width,height/metadata.height),4096/Math.max(metadata.width,metadata.height));
     const result=await sharp(original,{limitInputPixels:40_000_000}).resize(Math.max(1,Math.round(metadata.width*scale)),Math.max(1,Math.round(metadata.height*scale))).webp({quality:90}).toBuffer();
     const tmp=output+'.'+process.pid+'.tmp';await fs.writeFile(tmp,result,{mode:0o600});await fs.rename(tmp,output);return result;
    })().finally(()=>pending.delete(output)));
    bytes=await pending.get(output);
   }
  }else bytes=await fs.readFile(path.join(dir,name));
  res.writeHead(200,{'Content-Type':preview?'image/webp':types[name.split('.').at(-1)],'Content-Length':bytes.length});res.end(bytes);
 }catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end();}
}
