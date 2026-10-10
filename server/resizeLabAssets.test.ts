import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import sharp from 'sharp';
vi.mock('./mvp2Api.mjs',()=>({bannermaticStore:{authenticate:async(token:string)=>token==='owner'?{workspace:{id:'workspace'},user:{id:'owner'}}:token==='other'?{workspace:{id:'workspace'},user:{id:'other'}}:null}}));
let root:string,base:string,server:http.Server,image:string,asset:string,legacy:string;
const headers={authorization:'Bearer owner','content-type':'application/json'};
beforeAll(async()=>{
 root=await fs.mkdtemp(path.join(os.tmpdir(),'rl-assets-'));process.env.RESIZE_LAB_PROJECT_DIR=root;
 const {handleResizeLabProjects}=await import('./resizeLabProjects.mjs');
 image='data:image/png;base64,'+(await sharp({create:{width:300,height:250,channels:3,background:'#9955aa'}}).png().toBuffer()).toString('base64');
 legacy=JSON.stringify({id:'default',name:'Legacy',state:{image,logoImage:image,selected:['300x250'],results:{'300x250':{image,status:'ready'}},families:{square:{image,sourceId:'300x250'}}}});
 await fs.mkdir(path.join(root,'workspace','owner'),{recursive:true});await fs.writeFile(path.join(root,'workspace','owner','default.json'),legacy);
 server=http.createServer(async(req,res)=>{try{await handleResizeLabProjects(req,res,{json:(_req:any,r:any,status:number,payload:unknown)=>{r.writeHead(status,{'content-type':'application/json'});r.end(JSON.stringify(payload))},readBody:async(r:any)=>{let body='';for await(const c of r)body+=c;return JSON.parse(body)}})}catch(e){res.writeHead(500);res.end(String(e))}});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+(server.address() as any).port;
});
afterAll(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));await fs.rm(root,{recursive:true,force:true});delete process.env.RESIZE_LAB_PROJECT_DIR});
describe('project image storage and reload',()=>{
 it('restores legacy projects as small metadata and deduplicates originals without rewriting existing JSON',async()=>{
  const response=await fetch(base+'/api/resize-lab/projects/default',{headers});const raw=await response.text();const record=JSON.parse(raw);asset=record.state.image;
  expect(asset).toMatch(/^\/api\/resize-lab\/assets\/[a-f0-9]{64}\.png$/);expect(record.state.results['300x250'].image).toBe(asset);expect(record.state.families.square.image).toBe(asset);expect(raw).not.toContain('base64');
  expect(await fs.readdir(path.join(root,'workspace','owner','assets'))).toHaveLength(1);expect(await fs.readFile(path.join(root,'workspace','owner','default.json'),'utf8')).toBe(legacy);
 });
 it('serves an X2 preview with the original aspect ratio and retains exact original bytes',async()=>{
  const response=await fetch(base+asset+'?w=600&h=500',{headers});const preview=Buffer.from(await response.arrayBuffer());const metadata=await sharp(preview).metadata();expect([metadata.width,metadata.height]).toEqual([600,500]);expect(response.headers.get('cache-control')).toContain('immutable');
  const original=Buffer.from(await(await fetch(base+asset,{headers})).arrayBuffer());expect(original).toEqual(Buffer.from(image.split(',')[1],'base64'));
 });
 it('authenticates and isolates assets including conditional requests',async()=>{
  expect((await fetch(base+asset)).status).toBe(401);expect((await fetch(base+asset,{headers:{authorization:'Bearer other'}})).status).toBe(404);
  const response=await fetch(base+asset+'?w=600&h=500',{headers});const etag=response.headers.get('etag')!;await response.arrayBuffer();
  const cached=await fetch(base+asset+'?w=600&h=500',{headers:{...headers,'if-none-match':etag}});expect(cached.status).toBe(304);expect(await cached.text()).toBe('');
 });
 it('saves references, preserves local transforms and makes a compact reload',async()=>{
  const state={image,selected:['300x250'],results:{'300x250':{image,status:'ready',visual:{scale:1.5,x:-7,y:0}}},families:{square:{image,sourceId:'300x250'}}};
  const response=await fetch(base+'/api/resize-lab/projects/default',{method:'PUT',headers,body:JSON.stringify({name:'Saved',state})});expect(response.status).toBe(200);const record=await response.json();expect(record.state.results['300x250'].visual).toEqual(state.results['300x250'].visual);
  const saved=await fs.readFile(path.join(root,'workspace','owner','default.json'),'utf8');expect(saved).not.toContain('base64');expect(saved.length).toBeLessThan(1000);
  const reload=await(await fetch(base+'/api/resize-lab/projects/default',{headers})).json();expect(reload.state.results['300x250'].image).toBe(asset);
 });
});
