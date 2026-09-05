import path from "node:path";
import {BannermaticStore} from "./mvp2Store.mjs";
import {applyCreativePublish,figmaSpecFromCampaign} from "./mvp2Contract.mjs";
import {campaignCompliance} from "./mvp2Compliance.mjs";
import {BuildStore} from "./mvp2Builds.mjs";
import {CreativeVersionStore} from "./mvp2CreativeVersions.mjs";
import {matchTT,resolveCampaignTT} from "./mvp2TT.mjs";

const STORE_PATH=process.env.BANNERMATIC_DATA_FILE||path.resolve(process.cwd(),"runtime/bannermatic.json");
const BUILD_STORE_PATH=process.env.BANNERMATIC_BUILD_FILE||path.resolve(process.cwd(),"runtime/bannermatic-builds.json");
const CREATIVE_STORE_PATH=process.env.BANNERMATIC_CREATIVE_FILE||path.resolve(process.cwd(),"runtime/bannermatic-creative-versions.json");
export const bannermaticStore=new BannermaticStore(STORE_PATH);
export const bannermaticBuildStore=new BuildStore(BUILD_STORE_PATH);
export const bannermaticCreativeStore=new CreativeVersionStore(CREATIVE_STORE_PATH);

function bearer(req){const raw=String(req.headers.authorization||"");return raw.toLowerCase().startsWith("bearer ")?raw.slice(7).trim():"";}
function matchCampaignPath(url){return String(url||"").match(/^\/api\/campaigns\/([^/?#]+)$/);}
function matchCampaignAction(url,action){return String(url||"").match(new RegExp(`^/api/campaigns/([^/?#]+)/${action}$`));}
function matchBuildPath(url){return String(url||"").match(/^\/api\/campaigns\/([^/?#]+)\/builds\/([^/?#]+)$/);}
function matchCreativeVersionPath(url){return String(url||"").match(/^\/api\/campaigns\/([^/?#]+)\/creative-versions\/([^/?#]+)$/);}
function matchMemberPath(url){return String(url||"").match(/^\/api\/workspace\/members\/([^/?#]+)$/);}

export async function handleMvp2Api(req,res,{json,readBody}){
 const url=String(req.url||"").split("?")[0];
 if(!url.startsWith("/api/auth/")&&!url.startsWith("/api/campaigns")&&!url.startsWith("/api/workspace/"))return false;
 await bannermaticStore.load();
 await bannermaticBuildStore.load();
 await bannermaticCreativeStore.load();
 try{
  if(req.method==="POST"&&url==="/api/auth/register"){const body=await readBody(req);return json(req,res,201,await bannermaticStore.register(body));}
  if(req.method==="POST"&&url==="/api/auth/login"){const body=await readBody(req);return json(req,res,200,await bannermaticStore.login(body));}
  const token=bearer(req),auth=await bannermaticStore.authenticate(token);
  if(req.method==="POST"&&url==="/api/auth/logout"){if(token)await bannermaticStore.logout(token);return json(req,res,200,{ok:true});}
  if(req.method==="GET"&&url==="/api/auth/me"){if(!auth)return json(req,res,401,{error:"Unauthorized"});return json(req,res,200,{user:auth.user,workspace:auth.workspace,role:auth.role,expiresAt:auth.session.expiresAt});}
  if(!auth)return json(req,res,401,{error:"Unauthorized"});
  if(req.method==="GET"&&url==="/api/campaigns")return json(req,res,200,{items:bannermaticStore.listCampaigns(auth)});
  if(req.method==="POST"&&url==="/api/campaigns"){bannermaticStore.requireRole(auth,["owner","admin","producer"]);const body=await readBody(req);return json(req,res,201,await bannermaticStore.createCampaign(auth,body));}

  const specMatch=matchCampaignAction(url,"figma-spec");
  if(specMatch&&req.method==="GET"){
   const campaign=bannermaticStore.getCampaign(auth,decodeURIComponent(specMatch[1]));
   return json(req,res,200,figmaSpecFromCampaign(campaign));
  }

  const ttResolveMatch=matchCampaignAction(url,"tt-resolve");
  if(ttResolveMatch&&req.method==="GET"){
   const campaign=bannermaticStore.getCampaign(auth,decodeURIComponent(ttResolveMatch[1]));
   return json(req,res,200,resolveCampaignTT(campaign));
  }
  if(ttResolveMatch&&req.method==="POST"){
   const campaign=bannermaticStore.getCampaign(auth,decodeURIComponent(ttResolveMatch[1]));
   const body=await readBody(req);
   return json(req,res,200,body.placementId?(()=>{const placement=(campaign.placements||[]).find(p=>p.id===body.placementId);if(!placement)throw Object.assign(new Error("Placement not found"),{status:404});return{campaignId:campaign.id,placementId:placement.id,...matchTT({...placement,...body})};})():resolveCampaignTT(campaign));
  }

  const complianceMatch=matchCampaignAction(url,"compliance");
  if(complianceMatch&&req.method==="GET"){
   const campaign=bannermaticStore.getCampaign(auth,decodeURIComponent(complianceMatch[1]));
   return json(req,res,200,campaignCompliance(campaign));
  }

  const versionsMatch=matchCampaignAction(url,"creative-versions");
  if(versionsMatch&&req.method==="GET"){
   const campaignId=decodeURIComponent(versionsMatch[1]);
   bannermaticStore.getCampaign(auth,campaignId);
   return json(req,res,200,{items:bannermaticCreativeStore.list(campaignId)});
  }
  const versionMatch=matchCreativeVersionPath(url);
  if(versionMatch&&req.method==="GET"){
   const campaignId=decodeURIComponent(versionMatch[1]),version=Number(decodeURIComponent(versionMatch[2]));
   bannermaticStore.getCampaign(auth,campaignId);
   const item=bannermaticCreativeStore.get(campaignId,version);
   return item?json(req,res,200,item):json(req,res,404,{error:"Creative version not found"});
  }

  const buildsMatch=matchCampaignAction(url,"builds");
  if(buildsMatch&&req.method==="GET"){
   const campaignId=decodeURIComponent(buildsMatch[1]);
   bannermaticStore.getCampaign(auth,campaignId);
   return json(req,res,200,{items:bannermaticBuildStore.list(campaignId)});
  }
  if(buildsMatch&&req.method==="POST"){
   bannermaticStore.requireRole(auth,["owner","admin","producer"]);
   const campaignId=decodeURIComponent(buildsMatch[1]);
   const campaign=bannermaticStore.getCampaign(auth,campaignId);
   const build=await bannermaticBuildStore.create(campaign);
   return json(req,res,build.state==="ready"?201:409,{build,compliance:campaignCompliance(campaign)});
  }
  const buildMatch=matchBuildPath(url);
  if(buildMatch&&req.method==="GET"){
   const campaignId=decodeURIComponent(buildMatch[1]),id=decodeURIComponent(buildMatch[2]);
   bannermaticStore.getCampaign(auth,campaignId);
   const item=bannermaticBuildStore.get(campaignId,id);
   return item?json(req,res,200,item):json(req,res,404,{error:"Build not found"});
  }

  const publishMatch=matchCampaignAction(url,"creative-publish");
  if(publishMatch&&req.method==="POST"){
   bannermaticStore.requireRole(auth,["owner","admin","designer"]);
   const campaignId=decodeURIComponent(publishMatch[1]);
   const campaign=bannermaticStore.getCampaign(auth,campaignId);
   const body=await readBody(req);
   const publication=applyCreativePublish(campaign,body);
   const updated=await bannermaticStore.updateCampaign({...auth,role:"owner"},campaignId,publication.patch);
   const version=await bannermaticCreativeStore.add(updated,{touched:publication.touched});
   return json(req,res,200,{campaign:updated,touched:publication.touched,version,compliance:campaignCompliance(updated)});
  }

  const campaignMatch=matchCampaignPath(url);
  if(campaignMatch&&req.method==="GET")return json(req,res,200,bannermaticStore.getCampaign(auth,decodeURIComponent(campaignMatch[1])));
  if(campaignMatch&&(req.method==="PUT"||req.method==="PATCH")){
   bannermaticStore.requireRole(auth,["owner","admin","producer"]);
   const body=await readBody(req);
   return json(req,res,200,await bannermaticStore.updateCampaign(auth,decodeURIComponent(campaignMatch[1]),body));
  }
  if(req.method==="GET"&&url==="/api/workspace/members")return json(req,res,200,{items:bannermaticStore.listMembers(auth)});
  const memberMatch=matchMemberPath(url);
  if(memberMatch&&req.method==="PATCH"){const body=await readBody(req);return json(req,res,200,await bannermaticStore.updateMemberRole(auth,decodeURIComponent(memberMatch[1]),String(body.role||"")));}
  return json(req,res,404,{error:"Not found"});
 }catch(error){return json(req,res,Number(error?.status)||500,{error:error instanceof Error?error.message:String(error)});}
}
