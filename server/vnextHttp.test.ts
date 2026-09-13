import http from 'node:http';
import {inflateRawSync} from 'node:zlib';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';

type Running={server:http.Server;base:string};
let root='',running:Running;

function json(_req:http.IncomingMessage,res:http.ServerResponse,status:number,payload:unknown){res.writeHead(status,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(payload));}
async function readBody(req:http.IncomingMessage){let body='';for await(const chunk of req)body+=chunk;return body?JSON.parse(body):{};}
async function start(_suffix:string):Promise<Running>{
 vi.resetModules();
 const {handleMvp2Api}=await import('./mvp2Api.mjs');
 const layoutReview=async(input:any,scope:any)=>({rationale:'Mock bounded review',elements:(input.target?.elements||[]).map((element:any)=>({id:element.id,dx:0,dy:0,dScale:0,dFontSize:0})),model:'test-layout-model',scope});
 const server=http.createServer(async(req,res)=>{try{if(await handleMvp2Api(req,res,{json,readBody,layoutReview})||res.writableEnded)return;json(req,res,404,{error:'Not found'});}catch(error){json(req,res,500,{error:error instanceof Error?error.message:String(error)});}});
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const address=server.address();if(!address||typeof address==='string')throw new Error('No HTTP address');
 return {server,base:`http://127.0.0.1:${address.port}`};
}
async function stop(server:http.Server){await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
function readZip(input:Buffer){
 const files=new Map<string,Buffer>();let offset=0;
 while(offset+30<=input.length&&input.readUInt32LE(offset)===0x04034b50){
  const method=input.readUInt16LE(offset+8),compressed=input.readUInt32LE(offset+18),nameLength=input.readUInt16LE(offset+26),extraLength=input.readUInt16LE(offset+28);
  const nameStart=offset+30,dataStart=nameStart+nameLength+extraLength,name=input.subarray(nameStart,nameStart+nameLength).toString('utf8'),data=input.subarray(dataStart,dataStart+compressed);
  files.set(name,method===8?inflateRawSync(data):Buffer.from(data));offset=dataStart+compressed;
 }
 return files;
}
async function request(url:string,options:RequestInit={}){const response=await fetch(url,options);const type=response.headers.get('content-type')||'';return {response,body:type.includes('json')?await response.json():Buffer.from(await response.arrayBuffer())};}

beforeAll(async()=>{
 root=await mkdtemp(path.join(tmpdir(),'bannermatic-http-'));
 process.env.BANNERMATIC_DATA_FILE=path.join(root,'data.json');
 process.env.BANNERMATIC_BUILD_FILE=path.join(root,'builds.json');
 process.env.BANNERMATIC_CREATIVE_FILE=path.join(root,'creative.json');
 running=await start('first');
});
afterAll(async()=>{if(running?.server)await stop(running.server);if(root)await rm(root,{recursive:true,force:true});});

describe('vNext live HTTP campaign production',()=>{
 it('persists, preflights and downloads real placement-specific HTML5 packages',async()=>{
  const auth=await request(`${running.base}/api/auth/register`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'http-e2e@example.test',password:'correct-horse',name:'HTTP E2E'})});
  expect(auth.response.status).toBe(201);const token=(auth.body as any).token,headers={'content-type':'application/json',authorization:`Bearer ${token}`};
  const created=await request(`${running.base}/api/campaigns`,{method:'POST',headers,body:JSON.stringify({name:'Production proof',locale:'en'})});
  expect(created.response.status).toBe(201);const id=(created.body as any).id;
  const pair=await request(`${running.base}/api/campaigns/${id}/figma-pair`,{method:'POST',headers});expect(pair.response.status).toBe(201);
  const claimed=await request(`${running.base}/api/figma/pair/claim`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code:(pair.body as any).code})});expect(claimed.response.status).toBe(200);
  const reviewed=await request(`${running.base}/api/figma/layout-review`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${(claimed.body as any).token}`},body:JSON.stringify({target:{elements:[{id:'headline'}]}})});expect(reviewed.response.status).toBe(200);expect(reviewed.body).toMatchObject({model:'test-layout-model',elements:[{id:'headline'}]});
  const placements=[
   {id:'p-yandex',platform:'Yandex',placement:'ROS',width:300,height:250,contentVariantIds:['en','ru'],creativeType:'HTML5',requirements:{sourceLabel:'Client TT',maxZipKb:150,maxDurationSec:1,clickTag:true,clickUrl:'https://example.test/yandex',legal:'18+'}},
   {id:'p-mail',platform:'Mail',placement:'Homepage',width:300,height:250,contentVariantIds:['en','ru'],creativeType:'HTML5',requirements:{sourceLabel:'Client TT',maxZipKb:150,maxDurationSec:1,clickTag:true,clickUrl:'https://example.test/mail',legal:'18+'}}
  ];
  const contentVariants=[
   {id:'en',name:'EN',language:'en',headline:'Summer sale',copy:'Selected items',cta:'Shop now',legal:'18+'},
   {id:'ru',name:'RU',language:'ru',headline:'Летняя акция',copy:'Выбранные товары',cta:'Подробнее',legal:'18+'}
  ];
  const formats=[{id:'fmt-300x250',width:300,height:250,size:'300×250',placementIds:['p-yandex','p-mail'],creativeState:'missing',creativeVersion:0}];
  const updated=await request(`${running.base}/api/campaigns/${id}`,{method:'PATCH',headers,body:JSON.stringify({placements,contentVariants,formats,status:'media-ready',mediaPlanVersion:1})});
  expect(updated.response.status).toBe(200);
  const published=await request(`${running.base}/api/campaigns/${id}/template-publish`,{method:'POST',headers});
  expect(published.response.status).toBe(200);expect((published.body as any).formats[0].creativeState).toBe('published');
  const compliance=await request(`${running.base}/api/campaigns/${id}/compliance`,{headers});
  expect(compliance.response.status).toBe(200);expect((compliance.body as any).summary).toEqual({ready:4,warning:0,blocked:0,total:4});
  const built=await request(`${running.base}/api/campaigns/${id}/builds`,{method:'POST',headers});
  expect(built.response.status).toBe(201);const build=(built.body as any).build;expect(build.placements).toHaveLength(4);
  const downloaded=await request(`${running.base}/api/campaigns/${id}/builds/${build.id}/download`,{headers});
  expect(downloaded.response.status).toBe(200);expect(downloaded.response.headers.get('content-type')).toBe('application/zip');
  const outer=readZip(downloaded.body as Buffer);expect(outer.has('manifest.json')).toBe(true);expect([...outer.keys()].filter(name=>name.endsWith('.zip'))).toHaveLength(4);
  const html=[...outer.entries()].filter(([name])=>name.endsWith('.zip')).map(([,bytes])=>readZip(bytes).get('index.html')?.toString('utf8')||'').join('\n');
  expect(html).toContain('Summer sale');expect(html).toContain('Летняя акция');expect(html).toContain('https://example.test/yandex');expect(html).toContain('https://example.test/mail');
  const stale=structuredClone(published.body as any);stale.contentVariants[0].headline='Changed after publish';
  const staleSaved=await request(`${running.base}/api/campaigns/${id}`,{method:'PATCH',headers,body:JSON.stringify({contentVariants:stale.contentVariants})});expect(staleSaved.response.status).toBe(200);
  const blocked=await request(`${running.base}/api/campaigns/${id}/builds`,{method:'POST',headers});expect(blocked.response.status).toBe(409);expect((blocked.body as any).build.state).toBe('blocked');
  await stop(running.server);running=await start('reload');
  const restored=await request(`${running.base}/api/campaigns/${id}`,{headers});expect(restored.response.status).toBe(200);expect((restored.body as any).contentVariants[0].headline).toBe('Changed after publish');
  const history=await request(`${running.base}/api/campaigns/${id}/builds`,{headers});expect(history.response.status).toBe(200);expect((history.body as any).items).toHaveLength(2);
  const renamed=await request(`${running.base}/api/campaigns/${id}`,{method:'PATCH',headers,body:JSON.stringify({name:'Renamed production proof'})});expect(renamed.response.status).toBe(200);expect((renamed.body as any).name).toBe('Renamed production proof');
  const deleted=await request(`${running.base}/api/campaigns/${id}`,{method:'DELETE',headers});expect(deleted.response.status).toBe(200);expect(deleted.body).toMatchObject({ok:true,id,name:'Renamed production proof'});
  const missing=await request(`${running.base}/api/campaigns/${id}`,{headers});expect(missing.response.status).toBe(404);
 });
});
