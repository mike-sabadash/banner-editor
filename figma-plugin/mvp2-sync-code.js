const NS="banner_campaign";
const CLOUD="https://ads.rechord.online";
const TOKEN_KEY="bannermatic:plugin-token";
figma.showUI(__html__,{width:420,height:580,themeColors:true});

const meta=(node,key,value)=>node.setSharedPluginData(NS,key,String(value??""));
const getMeta=(node,key)=>node.getSharedPluginData(NS,key);
const familyFor=(w,h)=>h<=100||w/h>=3?"Strip":h>w?"Vertical":"Rectangle";

async function request(path,{method="GET",body,token}={}){
 const headers={"content-type":"application/json"};
 if(token)headers.authorization=`Bearer ${token}`;
 const response=await fetch(`${CLOUD}${path}`,{method,headers,body:body?JSON.stringify(body):undefined});
 let data={};try{data=await response.json()}catch{}
 if(!response.ok)throw Error(data.error||`Cloud request failed (${response.status})`);
 return data;
}
function roots(){return figma.currentPage.findAll(n=>n.type==="COMPONENT"&&getMeta(n,"campaignId")&&getMeta(n,"formatId"));}
function campaignRoots(campaignId){return roots().filter(n=>getMeta(n,"campaignId")===campaignId)}
function formatKey(w,h){return`${Math.round(w)}x${Math.round(h)}`}
async function ensureFonts(){await Promise.all([{family:"Inter",style:"Regular"},{family:"Inter",style:"Bold"}].map(f=>figma.loadFontAsync(f)))}
async function addText(root,name,text,x,y,size,bold=false){const n=figma.createText();n.name=name;n.fontName={family:"Inter",style:bold?"Bold":"Regular"};n.fontSize=size;n.characters=text;n.x=x;n.y=y;n.resize(Math.max(30,root.width-x*2),Math.max(18,size*1.4));n.textAutoResize="HEIGHT";root.appendChild(n);return n}
function addRect(root,name,x,y,w,h){const n=figma.createRectangle();n.name=name;n.x=x;n.y=y;n.resize(Math.max(1,w),Math.max(1,h));n.fills=[{type:"SOLID",color:{r:.08,g:.085,b:.07}}];n.cornerRadius=Math.min(8,h/2);root.appendChild(n);return n}
async function createFormat(format,spec,x,y){const w=Number(format.width),h=Number(format.height);const root=figma.createComponent();root.name=`${w}×${h}, ${familyFor(w,h)}`;root.resize(w,h);root.x=x;root.y=y;root.clipsContent=true;root.fills=[{type:"SOLID",color:{r:.95,g:.955,b:.94}}];meta(root,"campaignId",spec.campaignId);meta(root,"campaignName",spec.campaignName);meta(root,"formatId",format.formatId);meta(root,"familyId",familyFor(w,h));meta(root,"deliveryPlacements",JSON.stringify((format.placementIds||[]).map(id=>({id}))));meta(root,"mediaPlanVersion",spec.mediaPlanVersion||0);meta(root,"ttSnapshotVersion",spec.ttSnapshotVersion||0);const pad=Math.max(8,Math.round(Math.min(w,h)*.07)),headline=Math.max(10,Math.min(30,Math.round(Math.min(w,h)*.09)));await addText(root,"Headline","Campaign headline",pad,pad,headline,true);if(h>90)await addText(root,"Copy","Campaign copy",pad,pad+headline*1.7,Math.max(8,Math.round(headline*.55)));if(w>130&&h>75)addRect(root,"CTA",pad,h-pad-Math.min(36,Math.max(24,h*.09)),Math.min(130,Math.max(64,w*.42)),Math.min(36,Math.max(24,h*.09)));return root}
async function syncFromCloud(token){await figma.currentPage.loadAsync();await ensureFonts();const spec=await request("/api/figma/campaign",{token});const existing=campaignRoots(spec.campaignId);const existingKeys=new Set(existing.map(r=>formatKey(r.width,r.height)));const required=Array.isArray(spec.formats)?spec.formats:[];const missing=required.filter(f=>!existingKeys.has(formatKey(f.width,f.height)));for(const root of existing){const match=required.find(f=>formatKey(f.width,f.height)===formatKey(root.width,root.height));if(match){meta(root,"formatId",match.formatId);meta(root,"deliveryPlacements",JSON.stringify((match.placementIds||[]).map(id=>({id}))));meta(root,"mediaPlanVersion",spec.mediaPlanVersion||0);meta(root,"ttSnapshotVersion",spec.ttSnapshotVersion||0)}}let x=existing.length?Math.max(...existing.map(r=>r.x+r.width))+100:0,y=existing.length?Math.min(...existing.map(r=>r.y)):0,row=0;const made=[];for(const f of missing){const root=await createFormat(f,spec,x,y);made.push(root);x+=root.width+80;row=Math.max(row,root.height);if(x>1900){x=0;y+=row+100;row=0}}if(made.length){figma.currentPage.selection=made;figma.viewport.scrollAndZoomIntoView(made)}return{spec,created:made.length,updated:existing.length,total:required.length,missingAfter:0}}
function creativePayload(campaignId){return campaignRoots(campaignId).map(root=>({formatId:getMeta(root,"formatId"),previewType:"figma",durationSec:Number(getMeta(root,"duration")||getMeta(root,"durationSec")||6)})).filter(x=>x.formatId)}
async function currentConnection(){const token=await figma.clientStorage.getAsync(TOKEN_KEY);if(!token)return null;try{const spec=await request("/api/figma/campaign",{token});return{token,spec}}catch{await figma.clientStorage.deleteAsync(TOKEN_KEY);return null}}
async function pair(code){const result=await request("/api/figma/pair/claim",{method:"POST",body:{code}});await figma.clientStorage.setAsync(TOKEN_KEY,result.token);const synced=await syncFromCloud(result.token);return{...result,synced}}
async function publish(){const connection=await currentConnection();if(!connection)throw Error("Connect this Figma file to a Bannermatic campaign first");const formats=creativePayload(connection.spec.campaignId);if(!formats.length)throw Error("No connected campaign formats found in this page");return request("/api/figma/creative-publish",{method:"POST",token:connection.token,body:{formats}})}

figma.ui.onmessage=async msg=>{try{
 if(msg.type==="status"){const connection=await currentConnection();figma.ui.postMessage({type:"status",connection:connection?{campaignId:connection.spec.campaignId,campaignName:connection.spec.campaignName,formats:connection.spec.formats?.length||0,mediaPlanVersion:connection.spec.mediaPlanVersion,ttSnapshotVersion:connection.spec.ttSnapshotVersion}:null});return}
 if(msg.type==="pair"){const result=await pair(String(msg.code||"").replace(/\D/g,""));figma.ui.postMessage({type:"paired",result});return}
 if(msg.type==="sync"){const connection=await currentConnection();if(!connection)throw Error("Connect a campaign first");const result=await syncFromCloud(connection.token);figma.ui.postMessage({type:"synced",result});return}
 if(msg.type==="publish"){const result=await publish();figma.ui.postMessage({type:"published",result});return}
 if(msg.type==="disconnect"){await figma.clientStorage.deleteAsync(TOKEN_KEY);figma.ui.postMessage({type:"disconnected"});return}
 }catch(error){figma.ui.postMessage({type:"error",message:error instanceof Error?error.message:String(error)})}}
