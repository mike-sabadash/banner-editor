import {promises as fs} from "node:fs";
import path from "node:path";
import {externalizeProjectImages,serveProjectAsset} from "./resizeLabAssets.mjs";
import {bannermaticStore} from "./mvp2Api.mjs";

const root=process.env.RESIZE_LAB_PROJECT_DIR||path.resolve(process.cwd(),"runtime/resize-lab-projects");
const bearer=req=>String(req.headers.authorization||"").replace(/^Bearer\s+/i,"").trim();
const safe=id=>/^[a-zA-Z0-9_-]{1,80}$/.test(id);
export async function handleResizeLabProjects(req,res,{json,readBody}){
 const url=new URL(req.url||"/","http://localhost");
 if(!url.pathname.startsWith("/api/resize-lab/projects")&&!url.pathname.startsWith("/api/resize-lab/assets/"))return false;
 const auth=await bannermaticStore.authenticate(bearer(req));
 if(!auth){json(req,res,401,{error:"Sign in to save projects"});return true;}
 const dir=path.join(root,auth.workspace.id,auth.user.id);
 const assetsDir=path.join(dir,"assets");
 if(url.pathname.startsWith("/api/resize-lab/assets/")){if(req.method!=="GET"){json(req,res,405,{error:"Method not allowed"});return true;}await serveProjectAsset(req,res,url,assetsDir);return true;}
 const match=url.pathname.match(/^\/api\/resize-lab\/projects\/([\w-]+)$/);
 if(req.method==="GET"&&url.pathname==="/api/resize-lab/projects"){
  await fs.mkdir(dir,{recursive:true});
  const files=(await fs.readdir(dir)).filter(x=>x.endsWith(".json"));
  const items=await Promise.all(files.map(async name=>{try{const x=JSON.parse(await fs.readFile(path.join(dir,name),"utf8"));return{id:x.id,name:x.name,updatedAt:x.updatedAt};}catch{return null}}));
  json(req,res,200,{items:items.filter(Boolean).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))});return true;
 }
 if(!match||!safe(match[1])){json(req,res,404,{error:"Not found"});return true;}
 const file=path.join(dir,match[1]+".json");
 if(req.method==="GET"){
  try{
   const record=JSON.parse(await fs.readFile(file,"utf8"));
   // Legacy inline projects stay readable; their original JSON is not rewritten by GET.
   record.state=await externalizeProjectImages(record.state,assetsDir);
   res.setHeader("Cache-Control","private, no-cache");
   json(req,res,200,record);
  }catch(e){json(req,res,e.code==="ENOENT"?404:500,{error:"Project unavailable"});}return true;
 }
 if(req.method==="PUT"){
  const body=await readBody(req);
  if(!body||typeof body!=="object"||!body.state||typeof body.state!=="object"){json(req,res,400,{error:"Invalid project"});return true;}
  const record={id:match[1],name:String(body.name||"Untitled project").slice(0,120),updatedAt:new Date().toISOString(),state:await externalizeProjectImages(body.state,assetsDir)};
  await fs.mkdir(dir,{recursive:true});
  const tmp=file+"."+process.pid+"."+Date.now()+".tmp";
  await fs.writeFile(tmp,JSON.stringify(record),{mode:0o600});await fs.rename(tmp,file);
  json(req,res,200,{id:record.id,updatedAt:record.updatedAt,state:record.state});return true;
 }
 json(req,res,405,{error:"Method not allowed"});return true;
}
