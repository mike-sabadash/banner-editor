const NS="banner_campaign";
const CLOUD="https://ads.rechord.online";
const TOKEN_KEY="bannermatic:plugin-token";
figma.showUI(__html__,{width:420,height:640,themeColors:true});

const meta=(n,k,v)=>n.setSharedPluginData(NS,k,String(v??""));
const getMeta=(n,k)=>n.getSharedPluginData(NS,k);
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const slug=v=>String(v||"layer").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"layer";
const familyFor=(w,h)=>h<=100||w/h>=3?"Strip":h>w?"Vertical":"Rectangle";

async function request(path,{method="GET",body,token}={}){
 const headers={"content-type":"application/json"};if(token)headers.authorization=`Bearer ${token}`;
 const r=await fetch(`${CLOUD}${path}`,{method,headers,body:body?JSON.stringify(body):undefined});
 let data={};try{data=await r.json()}catch{}if(!r.ok)throw Error(data.error||`Cloud request failed (${r.status})`);return data;
}
function roots(){return figma.currentPage.findAll(n=>n.type==="COMPONENT"&&getMeta(n,"campaignId")&&getMeta(n,"formatId"))}
function campaignRoots(id){return roots().filter(n=>getMeta(n,"campaignId")===id)}
function formatRoot(node){let n=node;while(n&&n!==figma.currentPage){if(getMeta(n,"formatId"))return n;n=n.parent}return null}
function formatKey(w,h){return`${Math.round(w)}x${Math.round(h)}`}
async function byId(id){return id&&figma.getNodeByIdAsync?figma.getNodeByIdAsync(id):null}

const aliases={headline:"headline.primary",title:"headline.primary",copy:"copy.secondary",subtitle:"copy.secondary",cta:"cta.primary",button:"cta.primary",ctabackground:"cta.background",legal:"legal.primary",disclaimer:"legal.primary",logo:"logo.primary",hero:"hero.primary",image:"image.primary",product:"product.primary",background:"background.primary"};
function inferredRole(n){const key=String(n.name||"").toLowerCase().replace(/[^a-z]/g,"");return aliases[key]||""}
function semanticRole(n){const explicit=getMeta(n,"semanticRole")||getMeta(n,"slotId"),inferred=inferredRole(n);if(inferred&&(!explicit||explicit.startsWith("custom.")))return inferred;if(explicit)return explicit;return inferred}
function roleFor(n,index){const existing=semanticRole(n);return existing||`custom.${slug(n.name)}.${index+1}`}
function setRole(n,role){meta(n,"semanticRole",role);meta(n,"slotId",role)}
function markManaged(n,source,role){setRole(n,role);meta(n,"managedBy","bannermatic");meta(n,"masterSourceId",source.id)}
function layerForSource(root,source,role){
 const children=root.children||[],exact=children.filter(n=>getMeta(n,"masterSourceId")===source.id);
 if(exact.length>1)throw Error(`Duplicate source link for ${source.name}. Review this format before updating.`);
 if(exact.length===1)return exact[0];
 // Roles are local to the parent, and cannot override an established source link.
 const candidates=children.filter(n=>!getMeta(n,"masterSourceId")&&semanticRole(n)===role&&n.type===source.type);
 if(candidates.length!==1)return null;
 markManaged(candidates[0],source,role);return candidates[0];
}
function pruneManaged(root,master){const liveIds=new Set((master.children||[]).map(n=>n.id)),liveRoles=new Set((master.children||[]).map((n,i)=>roleFor(n,i)));for(const n of [...(root.children||[])]){if(getMeta(n,"managedBy")==="bannermatic"&&getMeta(n,"masterSourceId")&&!liveIds.has(getMeta(n,"masterSourceId"))){n.remove();continue}const slot=getMeta(n,"slotId");if(slot&&slot.startsWith("custom.")&&!liveRoles.has(slot)&&!getMeta(n,"masterSourceId"))n.remove()}}
function dedupeRole(root,source,role,keep){
 const duplicates=(root.children||[]).filter(n=>n.id!==keep.id&&getMeta(n,"masterSourceId")===source.id);
 if(duplicates.length)throw Error(`Duplicate source link for ${source.name}. No layers were deleted.`);
}

const CORE_ROLES=new Set(["headline.primary","copy.secondary","cta.primary","cta.background","legal.primary"]);
function isLegacyGenerated(n){
 const names=new Set(["Headline","Copy","CTA","CTA Background","Legal"]);
 return getMeta(n,"managedBy")==="bannermatic"||names.has(String(n.name||""));
}
function migrateLegacyRoles(root){
 for(const n of root.findAll(x=>x!==root)){
  const inferred=inferredRole(n),explicit=getMeta(n,"semanticRole")||getMeta(n,"slotId");
  if(inferred&&(!explicit||explicit.startsWith("custom."))){setRole(n,inferred);if(isLegacyGenerated(n))meta(n,"managedBy","bannermatic")}
 }
}
function strictRoleInventory(root){
 const issues=[];
 for(const role of ["headline.primary","copy.secondary","cta.primary","cta.background"]){
  const nodes=root.findAll(n=>semanticRole(n)===role);
  if(role==="headline.primary"&&nodes.length!==1)issues.push(`${role}:${nodes.length}`);
  if(role!=="headline.primary"&&nodes.length>1)issues.push(`${role}:${nodes.length}`);
 }
 return{ok:issues.length===0,issues};
}
function cleanupLegacyDuplicates(root){
 // A shared name or role is never sufficient evidence to delete designer artwork.
 const seen=new Set(),duplicates=[];
 for(const n of root.children||[]){const id=getMeta(n,"masterSourceId");if(id&&seen.has(id))duplicates.push(n.name);if(id)seen.add(id)}
 meta(root,"duplicateLinkWarning",duplicates.join(", "));
}
function prepareMasterSlots(root){
 const walk=parent=>{const counts=new Map();for(const [index,n]of(parent.children||[]).entries()){let role=roleFor(n,index),seen=counts.get(role)||0;counts.set(role,seen+1);if(seen)role=`${role}.${seen+1}`;setRole(n,role);meta(n,"masterSourceId",n.id);if("children"in n)walk(n)}};
 walk(root);
}

async function ensureFont(n){if(n.type!=="TEXT")return;if(n.fontName!==figma.mixed)await figma.loadFontAsync(n.fontName);else for(const f of await n.getRangeAllFontNames(0,n.characters.length))await figma.loadFontAsync(f)}
async function ensureFonts(){for(const f of [{family:"Inter",style:"Regular"},{family:"Inter",style:"Bold"}])try{await figma.loadFontAsync(f)}catch{}}

async function addText(root,name,text,x,y,size,bold,role){const n=figma.createText();n.name=name;n.fontName={family:"Inter",style:bold?"Bold":"Regular"};n.fontSize=size;n.characters=text;n.x=x;n.y=y;n.resize(Math.max(30,root.width-x*2),Math.max(18,size*1.4));n.textAutoResize="HEIGHT";setRole(n,role);root.appendChild(n);return n}
function addRect(root,name,x,y,w,h,role){const n=figma.createRectangle();n.name=name;n.x=x;n.y=y;n.resize(Math.max(1,w),Math.max(1,h));n.fills=[{type:"SOLID",color:{r:.08,g:.085,b:.07}}];n.cornerRadius=Math.min(8,h/2);setRole(n,role);root.appendChild(n);return n}
async function createFormat(f,spec,x,y){const w=Number(f.width),h=Number(f.height),r=figma.createComponent();r.name=`${w}×${h}, ${familyFor(w,h)}`;r.resize(w,h);r.x=x;r.y=y;r.clipsContent=true;r.fills=[{type:"SOLID",color:{r:.95,g:.955,b:.94}}];for(const[k,v]of Object.entries({campaignId:spec.campaignId,campaignName:spec.campaignName,formatId:f.formatId,familyId:familyFor(w,h),mediaPlanVersion:spec.mediaPlanVersion||0,ttSnapshotVersion:spec.ttSnapshotVersion||0}))meta(r,k,v);const pad=Math.max(8,Math.round(Math.min(w,h)*.07)),fs=Math.max(10,Math.min(30,Math.round(Math.min(w,h)*.09)));await addText(r,"Headline","Campaign headline",pad,pad,fs,true,"headline.primary");if(h>90)await addText(r,"Copy","Campaign copy",pad,pad+fs*1.7,Math.max(8,Math.round(fs*.55)),false,"copy.secondary");if(w>130&&h>75){const bh=Math.min(36,Math.max(24,h*.09)),bw=Math.min(130,Math.max(64,w*.42));addRect(r,"CTA Background",pad,h-pad-bh,bw,bh,"cta.background");await addText(r,"CTA","Action",pad+8,h-pad-bh+Math.max(3,bh*.2),Math.max(10,Math.min(14,bh*.38)),true,"cta.primary")}return r}
async function syncFromCloud(token){await figma.currentPage.loadAsync();await ensureFonts();const spec=await request("/api/figma/campaign",{token}),existing=campaignRoots(spec.campaignId),required=spec.formats||[],used=new Set();let x=existing.length?Math.max(...existing.map(r=>r.x+r.width))+100:0,y=existing.length?Math.min(...existing.map(r=>r.y)):0,row=0,created=0,updated=0;for(const f of required){let r=existing.find(n=>!used.has(n.id)&&getMeta(n,"formatId")===f.formatId)||existing.find(n=>!used.has(n.id)&&formatKey(n.width,n.height)===formatKey(f.width,f.height));if(r){used.add(r.id);meta(r,"formatId",f.formatId);updated++;continue}r=await createFormat(f,spec,x,y);created++;x+=r.width+80;row=Math.max(row,r.height);if(x>1900){x=0;y+=row+100;row=0}}return{spec,created,updated,total:required.length}}

let masterId="";
function autoMaster(campaignId){const rs=campaignRoots(campaignId);if(!rs.length)return null;const current=rs.find(r=>getMeta(r,"isMaster")==="true");const master=current||rs.slice().sort((a,b)=>b.width*b.height-a.width*a.height)[0];for(const r of rs)meta(r,"isMaster",r.id===master.id?"true":"false");masterId=master.id;return master}
async function normalizeTextBox(n){if(n.type!=="TEXT")return;await ensureFont(n);const w=Math.max(24,n.width);n.textAutoResize="HEIGHT";n.resize(w,Math.max(1,n.height))}
async function ensureMaster(campaignId){let m=await byId(masterId);if(!m||m.removed||getMeta(m,"campaignId")!==campaignId)m=autoMaster(campaignId);if(m)for(const n of m.findAll(x=>x.type==="TEXT"))await normalizeTextBox(n);return m}
function masterState(master){if(!master)return null;return{id:master.id,formatId:getMeta(master,"formatId"),name:master.name,size:`${Math.round(master.width)}×${Math.round(master.height)}`,layers:(master.children||[]).length,resizes:campaignRoots(getMeta(master,"campaignId")).filter(r=>r.id!==master.id).length}}

function box(n,root){return{w:root.width?n.width/root.width:0,cx:root.width?(n.x+n.width/2)/root.width:.5,cy:root.height?(n.y+n.height/2)/root.height:.5}}
function place(source,sourceRoot,target,targetRoot){const b=box(source,sourceRoot),m=Math.max(4,Math.min(targetRoot.width,targetRoot.height)*.025);target.x=clamp(b.cx*targetRoot.width-target.width/2,m,Math.max(m,targetRoot.width-target.width-m));target.y=clamp(b.cy*targetRoot.height-target.height/2,m,Math.max(m,targetRoot.height-target.height-m))}
function isImageLike(n,role){
 const fills="fills"in n&&n.fills!==figma.mixed?n.fills:[];
 return /(^|\.)(hero|image|logo|product|background)/.test(role)||(Array.isArray(fills)&&fills.some(f=>f&&f.type==="IMAGE"));
}
function imageArea(n){return Math.max(0,Number(n.width)||0)*Math.max(0,Number(n.height)||0)}
function heroCandidate(root){
 const explicit=root.findAll(n=>semanticRole(n)==="hero.primary"||semanticRole(n)==="image.primary");
 if(explicit.length)return explicit.sort((a,b)=>imageArea(b)-imageArea(a))[0];
 const images=root.findAll(n=>n!==root&&isImageLike(n,semanticRole(n))&&n.type!=="TEXT"&&!/(logo|background|cta)/.test(semanticRole(n)));
 return images.length?images.sort((a,b)=>imageArea(b)-imageArea(a))[0]:null;
}
function ensureHeroRole(root){
 const hero=heroCandidate(root);
 if(hero&&semanticRole(hero)!=="hero.primary"){setRole(hero,"hero.primary");meta(hero,"managedBy","bannermatic")}
 return hero;
}
function scaledLineHeight(source,targetFont){const lh=source.lineHeight;if(lh===figma.mixed||!lh)return null;if(lh.unit==="PIXELS"&&typeof lh.value==="number"&&source.fontSize!==figma.mixed&&typeof source.fontSize==="number"&&source.fontSize>0)return{unit:"PIXELS",value:Math.max(1,targetFont*(lh.value/source.fontSize))};return clone(lh)}
async function syncText(source,target,{newLayer=false,sourceRoot,targetRoot}={}){await ensureFont(target);await normalizeTextBox(source);const existingWidth=Math.max(24,target.width);if(newLayer){const b=box(source,sourceRoot),margin=Math.max(6,Math.min(targetRoot.width,targetRoot.height)*.04),width=clamp(b.w*targetRoot.width,targetRoot.width*.28,targetRoot.width-margin*2);target.textAutoResize="HEIGHT";target.resize(width,Math.max(1,target.height));if(source.fontSize!==figma.mixed&&typeof source.fontSize==="number"){const s=Math.sqrt((targetRoot.width*targetRoot.height)/Math.max(1,sourceRoot.width*sourceRoot.height));target.fontSize=clamp(source.fontSize*clamp(s,.62,1.05),Math.max(8,source.fontSize*.58),source.fontSize*1.05)}place(source,sourceRoot,target,targetRoot)}else{target.textAutoResize="HEIGHT";target.resize(existingWidth,Math.max(1,target.height))}if(source.fontName!==figma.mixed){await figma.loadFontAsync(source.fontName);target.fontName=clone(source.fontName)}target.characters=source.characters;const tf=target.fontSize!==figma.mixed&&typeof target.fontSize==="number"?target.fontSize:16;const lh=scaledLineHeight(source,tf);if(lh)target.lineHeight=lh;target.textAlignHorizontal=source.textAlignHorizontal}
async function adaptNewLayer(source,target,sourceRoot,targetRoot,role){if(target.type==="TEXT"){await syncText(source,target,{newLayer:true,sourceRoot,targetRoot});return}const b=box(source,sourceRoot);if(isImageLike(target,role)){const ratio=Math.max(.01,source.width/Math.max(1,source.height)),w=clamp(targetRoot.width*clamp(b.w,.14,.72),24,targetRoot.width*.92),h=w/ratio,maxH=targetRoot.height*.88;if(h>maxH)target.resize(maxH*ratio,maxH);else target.resize(w,h);place(source,sourceRoot,target,targetRoot);return}const s=Math.min(1,targetRoot.width/Math.max(1,sourceRoot.width),targetRoot.height/Math.max(1,sourceRoot.height));if(target.resize)target.resize(Math.max(1,source.width*s),Math.max(1,source.height*s));place(source,sourceRoot,target,targetRoot)}
function markClonedTree(source,target,role){
 markManaged(target,source,role);
 const sources=source.children||[],targets=target.children||[];
 for(let i=0;i<sources.length;i++)if(targets[i])markClonedTree(sources[i],targets[i],roleFor(sources[i],i));
}
async function cloneInto(source,sourceRoot,targetRoot,role){const t=source.clone();targetRoot.appendChild(t);markClonedTree(source,t,role);await adaptNewLayer(source,t,sourceRoot,targetRoot,role);return t}

const MOTION_FIELDS=["TRANSLATION_X","TRANSLATION_Y","TRANSLATION_XY","OPACITY","ROTATION","SCALE_X","SCALE_Y","SCALE_XY","WIDTH","HEIGHT"];
const GEOM=new Set(["TRANSLATION_X","TRANSLATION_Y","TRANSLATION_XY","SCALE_X","SCALE_Y","SCALE_XY","WIDTH","HEIGHT"]);
function effective(field,n){const manual=(n.manualKeyframeTracks||{})[field];if(manual)return clone(manual);const anim=(n.animations||{})[field];if(!anim)return null;const keys=[];for(const tr of anim.tracks||[])for(const k of tr.keyframes||[])keys.push({timelinePosition:k.timelinePosition,easing:clone(k.easing),value:clone(k.value)});return keys.length?{baseValue:clone(anim.baseValue),keyframes:keys.sort((a,b)=>a.timelinePosition-b.timelinePosition)}:null}
function baseFor(field,target,sourceBase){if(field==="TRANSLATION_X"||field==="TRANSLATION_Y")return{type:"FLOAT",value:0};if(field==="TRANSLATION_XY")return{type:"VECTOR",value:{x:0,y:0}};if(field==="SCALE_X"||field==="SCALE_Y")return{type:"FLOAT",value:1};if(field==="SCALE_XY")return{type:"VECTOR",value:{x:1,y:1}};if(field==="WIDTH")return{type:"FLOAT",value:target.width};if(field==="HEIGHT")return{type:"FLOAT",value:target.height};return clone(sourceBase)}
function relative(v,sb,tb){if(!v||!sb||!tb)return clone(v);if(typeof v.value==="number"&&typeof sb.value==="number"&&typeof tb.value==="number")return{type:v.type,value:tb.value+(v.value-sb.value)};if(v.value&&sb.value&&tb.value)return{type:v.type,value:{x:tb.value.x+(v.value.x-sb.value.x),y:tb.value.y+(v.value.y-sb.value.y)}};return clone(v)}
async function syncMotion(source,target){
 let tracks=0;
 for(const field of MOTION_FIELDS){
  const s=effective(field,source);if(!s||!target.applyManualKeyframeTrack)continue;
  const base=baseFor(field,target,s.baseValue),out={baseValue:base,keyframes:(s.keyframes||[]).map(k=>({timelinePosition:k.timelinePosition,easing:clone(k.easing),value:GEOM.has(field)?relative(k.value,s.baseValue,base):clone(k.value)}))};
  try{target.applyManualKeyframeTrack({type:"PROPERTY",name:field},out);tracks++}catch(error){meta(target,"motionSyncWarning",`${field}: ${error instanceof Error?error.message:String(error)}`)}
 }
 if(Array.isArray(source.animationStyles)&&target.applyAnimationStyle){
  for(const s of source.animationStyles){try{target.applyAnimationStyle(s.styleId,{duration:s.duration,timelineOffset:s.timelineOffset,props:s.props?clone(s.props):undefined})}catch(error){meta(target,"motionSyncWarning",`style: ${error instanceof Error?error.message:String(error)}`)}}
 }
 return tracks;
}
// Motion must use final layout geometry, including any accepted AI correction.
async function syncFinalMotionTree(source,target){
 let tracks=await syncMotion(source,target);
 for(const child of source.children||[]){
  const linked=(target.children||[]).find(n=>getMeta(n,"masterSourceId")===child.id);
  if(linked)tracks+=await syncFinalMotionTree(child,linked);
 }
 return tracks;
}
async function syncFinalMotion(master,root){
 let tracks=0;
 for(const source of master.children||[]){
  const target=(root.children||[]).find(n=>getMeta(n,"masterSourceId")===source.id);
  if(target)tracks+=await syncFinalMotionTree(source,target);
 }
 return tracks;
}
async function syncExisting(source,target,sourceRoot,targetRoot){if(source.type==="TEXT"&&target.type==="TEXT")await syncText(source,target,{newLayer:false,sourceRoot,targetRoot});else if("fills"in source&&"fills"in target&&source.fills!==figma.mixed)target.fills=clone(source.fills);for(const f of["strokes","effects"])if(f in source&&f in target&&source[f]!==figma.mixed)target[f]=clone(source[f]);if("opacity"in source&&"opacity"in target)target.opacity=source.opacity;return 0}


function firstByRole(root,role){return root.findAll(n=>semanticRole(n)===role)[0]||null}
function allText(root){return root.findAll(n=>n.type==="TEXT")}
function allImageLike(root){const hero=heroCandidate(root),rest=root.findAll(n=>n!==root&&isImageLike(n,semanticRole(n))&&n.type!=="TEXT").filter(n=>!hero||n.id!==hero.id);return hero?[hero,...rest]:rest}
function textRhythm(node){
 const font=node.fontSize===figma.mixed?NaN:Number(node.fontSize),line=node.lineHeight;
 if(line===figma.mixed||!line)return null;
 return{font:Number.isFinite(font)&&font>0?font:16,line:clone(line)};
}
function applyTextRhythm(node,font,rhythm){
 node.fontSize=font;
 if(rhythm)node.lineHeight=rhythm.line.unit==="PIXELS"?{unit:"PIXELS",value:font*rhythm.line.value/rhythm.font}:clone(rhythm.line);
}
async function fitTextBox(node,{x,y,width,fontSize,minFont,lineHeight=1.05,maxHeight,align="LEFT",visible=true}){
 if(!node||node.type!=="TEXT")return false;
 await ensureFont(node);node.visible=visible;if(!visible)return true;
 node.textAutoResize="HEIGHT";node.x=x;node.y=y;node.textAlignHorizontal=align;
 const rhythm=textRhythm(node);const floor=Math.max(7,minFont||8);let fs=Math.max(floor,fontSize||12),fit=false;
 for(let i=0;i<80;i++){applyTextRhythm(node,fs,rhythm);node.resize(Math.max(20,width),Math.max(1,node.height));if(!maxHeight||node.height<=maxHeight+.5){fit=true;break}if(fs<=floor+.01)break;fs=Math.max(floor,fs-1)}
 return fit;
}
function resizeKeepRatio(node,w,h){if(!node||typeof node.resize!=="function")return;const ratio=Math.max(.01,node.width/Math.max(1,node.height));let nw=w,nh=nw/ratio;if(nh>h){nh=h;nw=nh*ratio}node.resize(Math.max(1,nw),Math.max(1,nh))}
function placeHeroCover(node,zx,zy,zw,zh){
 if(!node||typeof node.resize!=="function")return;
 const ratio=Math.max(.01,node.width/Math.max(1,node.height)),zoneRatio=zw/Math.max(1,zh);
 if(ratio>zoneRatio)node.resize(zh*ratio,zh);else node.resize(zw,zw/ratio);
 node.x=zx+(zw-node.width)/2;node.y=zy+(zh-node.height)/2;node.visible=true;
 meta(node,"mediaZone",JSON.stringify({x:zx,y:zy,w:zw,h:zh,mode:"cover"}));
}
function stripSpec(root){
 const ultra=root.height<=60;
 const pad=ultra?6:10,gap=ultra?6:10;
 const ctaW=ultra?76:104,ctaH=ultra?24:30;
 return{ultra,pad,gap,ctaW,ctaH,minHeadline:ultra?9:11,maxHeadline:ultra?13:20,minCopy:8,maxCopy:11};
}
async function wordWidthAt(node,word,fontSize){
 if(!node||node.type!=="TEXT"||!word)return 0;
 const temp=node.clone();node.parent.appendChild(temp);
 try{await ensureFont(temp);temp.characters=word;temp.fontSize=fontSize;temp.textAutoResize="WIDTH_AND_HEIGHT";return temp.width}finally{temp.remove()}
}
async function longestWordWidth(node,fontSize){
 if(!node||node.type!=="TEXT")return 0;
 const words=String(node.characters||"").split(/\s+/).filter(Boolean);let max=0;
 for(const w of words)max=Math.max(max,await wordWidthAt(node,w,fontSize));
 return max;
}
async function fitTextBinary(node,{x,y,width,height,minFont,maxFont,maxLines=2,lineHeight=1.05,visible=true}){
 if(!node||node.type!=="TEXT")return{ok:true,font:0,lines:0};
 await ensureFont(node);node.visible=visible;if(!visible)return{ok:true,font:0,lines:0};
 node.textAutoResize="HEIGHT";node.x=x;node.y=y;
 const rhythm=textRhythm(node);let lo=minFont,hi=maxFont,best=null;
 for(let i=0;i<10;i++){
  const fs=(lo+hi)/2;applyTextRhythm(node,fs,rhythm);node.resize(Math.max(20,width),1);
  const word=await longestWordWidth(node,fs),lines=Math.max(1,Math.round(node.height/(fs*lineHeight)));
  const ok=node.height<=height+.5&&word<=width+.5&&lines<=maxLines;
  if(ok){best={font:fs,lines,height:node.height};lo=fs}else hi=fs;
 }
 if(!best){applyTextRhythm(node,minFont,rhythm);node.resize(Math.max(20,width),1);const word=await longestWordWidth(node,minFont),lines=Math.max(1,Math.round(node.height/(minFont*lineHeight)));return{ok:node.height<=height+.5&&word<=width+.5&&lines<=maxLines,font:minFont,lines}}
 applyTextRhythm(node,best.font,rhythm);node.resize(Math.max(20,width),1);return{ok:true,font:best.font,lines:best.lines};
}
function stripNodes(root){return{headline:firstByRole(root,"headline.primary"),copy:firstByRole(root,"copy.secondary"),ctaBg:firstByRole(root,"cta.background"),cta:firstByRole(root,"cta.primary"),hero:allImageLike(root).find(n=>!/background|cta/.test(semanticRole(n)))||null}}
function rect(n){return n&&n.visible!==false?{l:n.x,t:n.y,r:n.x+n.width,b:n.y+n.height}:null}
function hits(a,b,gap=0){if(!a||!b)return false;return a.r+gap>b.l&&b.r+gap>a.l&&a.b+gap>b.t&&b.b+gap>a.t}
function inside(root,n){if(!n||n.visible===false)return true;return n.x>=-0.5&&n.y>=-0.5&&n.x+n.width<=root.width+.5&&n.y+n.height<=root.height+.5}
async function validateStrip(root,nodes,spec){
 const issues=[];for(const [name,n] of Object.entries(nodes))if(n&&!inside(root,n))issues.push(`${name}:bounds`);
 const hr=rect(nodes.headline),cr=rect(nodes.copy),br=rect(nodes.ctaBg),vr=rect(nodes.hero);
 if(hits(hr,br,spec.gap))issues.push('headline:cta');if(hits(cr,br,spec.gap))issues.push('copy:cta');if(hits(hr,vr,spec.gap))issues.push('headline:hero');if(hits(cr,vr,spec.gap))issues.push('copy:hero');
 if(nodes.headline?.visible!==false){const ww=await longestWordWidth(nodes.headline,Number(nodes.headline.fontSize)||spec.minHeadline);if(ww>nodes.headline.width+.5)issues.push('headline:broken-word')}
 return{ok:issues.length===0,issues};
}
async function solveStrip(root){
 const s=stripSpec(root),n=stripNodes(root),w=root.width,h=root.height;
 const snap=snapshotLayout(root);
 try{
  if(n.ctaBg){n.ctaBg.visible=true;n.ctaBg.resize(s.ctaW,s.ctaH);n.ctaBg.x=w-s.pad-s.ctaW;n.ctaBg.y=(h-s.ctaH)/2}
  if(n.cta){const x=n.ctaBg?n.ctaBg.x+8:w-s.pad-s.ctaW+8,y=n.ctaBg?n.ctaBg.y+5:(h-14)/2;const r=await fitTextBinary(n.cta,{x,y,width:s.ctaW-16,height:14,minFont:8,maxFont:s.ultra?10:12,maxLines:1,lineHeight:1});if(!r.ok)throw Error('cta-text')}
  if(s.ultra){
   if(n.copy)n.copy.visible=false;if(n.hero)n.hero.visible=false;
   const right=n.ctaBg?n.ctaBg.x-s.gap:w-s.pad;
   const r=await fitTextBinary(n.headline,{x:s.pad,y:Math.max(4,(h-24)/2),width:right-s.pad,height:24,minFont:s.minHeadline,maxFont:s.maxHeadline,maxLines:2,lineHeight:1.02});if(!r.ok)throw Error('headline-fit')
  }else{
   let right=n.ctaBg?n.ctaBg.x-s.gap:w-s.pad;
   if(n.hero&&right>330){const zw=Math.min(Math.round(w*.30),220),zh=h,zx=right-zw;placeHeroCover(n.hero,zx,0,zw,zh);right=zx-s.gap}else if(n.hero)n.hero.visible=false;
   const textW=right-s.pad;
   const headlineZone=Math.max(24,Math.round(h*.38));
   const hr=await fitTextBinary(n.headline,{x:s.pad,y:s.pad,width:textW,height:headlineZone,minFont:s.minHeadline,maxFont:s.maxHeadline,maxLines:2,lineHeight:1.02});if(!hr.ok)throw Error('headline-fit');
   if(n.copy){
    const copyY=Math.max(s.pad+headlineZone+4,n.headline.y+n.headline.height+5);
    const copyH=Math.max(12,h-s.pad-copyY);
    const cr=await fitTextBinary(n.copy,{x:s.pad,y:copyY,width:textW,height:copyH,minFont:s.minCopy,maxFont:s.maxCopy,maxLines:2,lineHeight:1.1,visible:copyH>=12});
    if(!cr.ok)n.copy.visible=false;
   }
  }
  const check=await validateStrip(root,n,s);if(!check.ok)throw Error(check.issues.join(','));
  meta(root,"layoutStatus","valid");meta(root,"layoutIssues","");return{ok:true,issues:[]};
 }catch(e){await restoreLayout(root,snap);meta(root,"layoutStatus","invalid");meta(root,"layoutIssues",e instanceof Error?e.message:String(e));return{ok:false,issues:[e instanceof Error?e.message:String(e)]}}
}
async function layoutStrip(root){return solveStrip(root)}
async function layoutRectangle(root){
 const w=root.width,h=root.height,pad=Math.max(10,Math.round(Math.min(w,h)*.055));
 const headline=firstByRole(root,"headline.primary"),copyNode=firstByRole(root,"copy.secondary"),ctaBg=firstByRole(root,"cta.background"),cta=firstByRole(root,"cta.primary");
 const hero=heroCandidate(root),heroW=hero?Math.round(w*.46):0,textW=hero?w-heroW-pad*2:w-pad*2;
 await fitTextBox(headline,{x:pad,y:pad,width:textW,fontSize:clamp(Math.round(Math.min(w,h)*.075),18,28),minFont:12,lineHeight:1.03,maxHeight:Math.round(h*.26)});
 const cy=headline?headline.y+headline.height+6:pad+36;
 if(copyNode)await fitTextBox(copyNode,{x:pad,y:cy,width:textW,fontSize:clamp(Math.round(Math.min(w,h)*.035),9,14),minFont:8,lineHeight:1.12,maxHeight:Math.max(14,Math.round(h*.18))});
 if(hero)placeHeroCover(hero,w-heroW,0,heroW,h);
 if(ctaBg){const bw=clamp(Math.round(textW*.42),72,128),bh=clamp(Math.round(h*.105),24,36);ctaBg.visible=true;ctaBg.resize(bw,bh);ctaBg.x=pad;ctaBg.y=h-pad-bh;if(cta)await fitTextBox(cta,{x:ctaBg.x+8,y:ctaBg.y+Math.max(3,(bh-13)/2),width:bw-16,fontSize:11,minFont:9,lineHeight:1,maxHeight:14})}
}
async function layoutVertical(root){
 const w=root.width,h=root.height,pad=Math.max(12,Math.round(w*.06));
 const headline=firstByRole(root,"headline.primary"),copyNode=firstByRole(root,"copy.secondary"),ctaBg=firstByRole(root,"cta.background"),cta=firstByRole(root,"cta.primary");
 const hero=heroCandidate(root);
 await fitTextBox(headline,{x:pad,y:pad,width:w-pad*2,fontSize:clamp(Math.round(w*.075),18,26),minFont:13,lineHeight:1.04,maxHeight:Math.round(h*.18)});
 const cy=headline?headline.y+headline.height+7:pad+38;
 if(copyNode)await fitTextBox(copyNode,{x:pad,y:cy,width:w-pad*2,fontSize:clamp(Math.round(w*.038),9,13),minFont:8,lineHeight:1.12,maxHeight:Math.round(h*.10)});
 const textBottom=(copyNode&&copyNode.visible)?copyNode.y+copyNode.height:(headline?headline.y+headline.height:pad);
 if(hero){const zy=Math.max(textBottom+12,Math.round(h*.30)),zh=Math.max(80,h-zy-(ctaBg?60:18)-pad);placeHeroCover(hero,0,zy,w,zh)}
 if(ctaBg){const bw=clamp(Math.round(w*.42),82,132),bh=32;ctaBg.visible=true;ctaBg.resize(bw,bh);ctaBg.x=pad;ctaBg.y=h-pad-bh;if(cta)await fitTextBox(cta,{x:ctaBg.x+8,y:ctaBg.y+9,width:bw-16,fontSize:11,minFont:9,lineHeight:1,maxHeight:14})}
}
async function smartLayout(root){const family=familyFor(root.width,root.height);if(family==="Strip")return layoutStrip(root);if(family==="Vertical")return layoutVertical(root);return layoutRectangle(root)}
function rectOf(n){return{x:n.x,y:n.y,w:n.width,h:n.height,r:n.x+n.width,b:n.y+n.height}}
function overlapArea(a,b){const x=Math.max(0,Math.min(a.r,b.r)-Math.max(a.x,b.x)),y=Math.max(0,Math.min(a.b,b.b)-Math.max(a.y,b.y));return x*y}
function layoutScore(root){let score=0;const key=(root.children||[]).filter(n=>n.visible!==false&&/headline|copy|cta|hero|image|logo/.test(semanticRole(n)));for(const n of key){const a=rectOf(n);if(a.x<0)score+=-a.x*10;if(a.y<0)score+=-a.y*10;if(a.r>root.width)score+=(a.r-root.width)*10;if(a.b>root.height)score+=(a.b-root.height)*10}for(let i=0;i<key.length;i++)for(let j=i+1;j<key.length;j++){const ra=semanticRole(key[i]),rb=semanticRole(key[j]);if((ra.includes("cta.background")&&rb.includes("cta.primary"))||(rb.includes("cta.background")&&ra.includes("cta.primary")))continue;const a=overlapArea(rectOf(key[i]),rectOf(key[j]));if(a>1)score+=a}return score}
function snapshotLayout(root){return(root.children||[]).map(n=>({id:n.id,x:n.x,y:n.y,w:n.width,h:n.height,visible:n.visible,font:n.type==="TEXT"&&n.fontSize!==figma.mixed?Number(n.fontSize):null,line:n.type==="TEXT"&&n.lineHeight!==figma.mixed?clone(n.lineHeight):null}))}
async function restoreLayout(root,snap){for(const s of snap){const n=await byId(s.id);if(!n||n.removed)continue;n.visible=s.visible;if(typeof n.resize==="function")n.resize(Math.max(1,s.w),Math.max(1,s.h));n.x=s.x;n.y=s.y;if(n.type==="TEXT"&&s.font!=null){await ensureFont(n);n.fontSize=s.font;if(s.line)n.lineHeight=s.line}}}
async function previewDataUrl(root){try{const bytes=await root.exportAsync({format:"PNG",constraint:{type:"SCALE",value:1}});return`data:image/png;base64,${figma.base64Encode(bytes)}`}catch{return undefined}}
function aiRole(n){const r=semanticRole(n);if(r.includes("background"))return"background";if(r.includes("logo"))return"logo";if(r.includes("headline"))return"headline";if(r.includes("copy"))return"text";if(r.includes("cta"))return"cta";if(r.includes("legal"))return"legal";if(isImageLike(n,r))return"image";return"ui"}
function aiElement(n){return{id:n.id,role:aiRole(n),kind:n.type,name:n.name||"",text:n.type==="TEXT"?n.characters:"",x:n.x,y:n.y,width:n.width,scale:1,fontSize:n.type==="TEXT"&&n.fontSize!==figma.mixed?Number(n.fontSize)||16:0,lineHeight:n.type==="TEXT"&&n.lineHeight!==figma.mixed&&n.lineHeight?.unit==="PIXELS"?Number(n.lineHeight.value)||0:0,visible:n.visible!==false}}
async function aiPolish(master,target,token){const before=layoutScore(target),snap=snapshotLayout(target);try{const payload={phase:"review",master:{width:master.width,height:master.height,elements:(master.children||[]).map(aiElement),previewDataUrl:await previewDataUrl(master)},target:{id:getMeta(target,"formatId")||target.id,width:target.width,height:target.height,elements:(target.children||[]).map(aiElement),previewDataUrl:await previewDataUrl(target)},assets:[]};const data=await request("/api/figma/layout-review",{method:"POST",body:payload,token});for(const d of data.elements||[]){const n=await byId(d.id);if(!n||n.removed||formatRoot(n)?.id!==target.id)continue;n.x=clamp(n.x+(Number(d.dx)||0)*target.width/100,0,Math.max(0,target.width-n.width));n.y=clamp(n.y+(Number(d.dy)||0)*target.height/100,0,Math.max(0,target.height-n.height));if(typeof n.resize==="function"&&Number(d.dScale)){const f=clamp(1+(Number(d.dScale)||0)/100,.85,1.15);n.resize(Math.max(1,n.width*f),Math.max(1,n.height*f))}if(n.type==="TEXT"&&n.fontSize!==figma.mixed&&Number(d.dFontSize)){await ensureFont(n);const rhythm=textRhythm(n);applyTextRhythm(n,clamp(Number(n.fontSize)+(Number(d.dFontSize)||0),8,72),rhythm)}}if(layoutScore(target)>before+.5){await restoreLayout(target,snap);meta(target,"aiLayout","rejected");return false}meta(target,"aiLayout",data.model||data.provider||"review");return true}catch(error){await restoreLayout(target,snap);meta(target,"aiLayout",`error:${error instanceof Error?error.message:String(error)}`);return false}}


async function syncMasterIntoRoot(master,root){
 let created=0,updated=0,tracks=0;
 prepareMasterSlots(master);migrateLegacyRoles(root);cleanupLegacyDuplicates(root);
 for(const [sourceIndex,source] of (master.children||[]).entries()){
  const role=roleFor(source,sourceIndex);setRole(source,role);meta(source,"masterSourceId",source.id);
  let target=layerForSource(root,source,role);
  if(!target){target=await cloneInto(source,master,root,role);created++}
  else{markManaged(target,source,role);tracks+=await syncExisting(source,target,master,root);const nested=await syncNestedSlots(source,target);created+=nested.created;updated+=nested.updated;tracks+=nested.tracks;updated++}
  dedupeRole(root,source,role,target);
 }
 cleanupLegacyDuplicates(root);
 return{created,updated,tracks};
}
async function syncNestedSlots(source,target){let created=0,updated=0,tracks=0;if(!("children"in source)||!("children"in target)||typeof target.appendChild!=="function")return{created,updated,tracks};for(const[index,child]of(source.children||[]).entries()){const role=roleFor(child,index);setRole(child,role);meta(child,"masterSourceId",child.id);let linked=layerForSource(target,child,role);if(!linked){linked=child.clone();target.appendChild(linked);markClonedTree(child,linked,role);await adaptNewLayer(child,linked,source,target,role);created++}else{markManaged(linked,child,role);tracks+=await syncExisting(child,linked,source,target);const nested=await syncNestedSlots(child,linked);created+=nested.created;updated+=nested.updated;tracks+=nested.tracks;updated++}}return{created,updated,tracks}}
async function copyVisualState(source,target){
 target.visible=source.visible;
 if(source.type==="TEXT"&&target.type==="TEXT"){
  await ensureFont(target);if(source.fontName!==figma.mixed){await figma.loadFontAsync(source.fontName);target.fontName=clone(source.fontName)}target.characters=source.characters;
  if(source.fontSize!==figma.mixed)target.fontSize=source.fontSize;
  if(source.lineHeight!==figma.mixed)target.lineHeight=clone(source.lineHeight);
  target.textAutoResize=source.textAutoResize;
 }
 if("fills" in source&&"fills" in target&&source.fills!==figma.mixed)target.fills=clone(source.fills);
 if("strokes" in source&&"strokes" in target&&source.strokes!==figma.mixed)target.strokes=clone(source.strokes);
 if("effects" in source&&"effects" in target&&source.effects!==figma.mixed)target.effects=clone(source.effects);
 if("opacity" in source&&"opacity" in target)target.opacity=source.opacity;
 if(typeof target.resize==="function")target.resize(Math.max(1,source.width),Math.max(1,source.height));
 target.x=source.x;target.y=source.y;
}
async function commitWorkingChildren(real,working){
 for(const wn of working.children||[]){
  const sid=getMeta(wn,"masterSourceId");if(!sid)continue;
  let rn=(real.children||[]).find(n=>getMeta(n,"masterSourceId")===sid);
  // A first sync may be adopting one unlinked placeholder; never search other groups.
  if(!rn){const matches=(real.children||[]).filter(n=>!getMeta(n,"masterSourceId")&&n.type===wn.type&&semanticRole(n)===semanticRole(wn));if(matches.length===1)rn=matches[0]}
  if(!rn){rn=wn.clone();real.appendChild(rn)}
  await copyVisualState(wn,rn);
  meta(rn,"masterSourceId",sid);meta(rn,"managedBy","bannermatic");setRole(rn,semanticRole(wn));
  if("children"in rn&&"children"in wn&&typeof rn.appendChild==="function")await commitWorkingChildren(rn,wn);
 }
}
async function commitWorkingStrip(real,working,master){
 await commitWorkingChildren(real,working);
 const inv=strictRoleInventory(real);if(!inv.ok)throw Error(`commit inventory ${inv.issues.join(",")}`);
 // Motion is applied recursively only after updateResizes finishes layout and AI.
}
async function transactionalStrip(master,real){
 const working=real.clone();working.x=real.x+100000;working.y=real.y;
 try{
  migrateLegacyRoles(working);cleanupLegacyDuplicates(working);
  await syncMasterIntoRoot(master,working);
  const invBefore=strictRoleInventory(working);
  if(!invBefore.ok)return{ok:false,issues:[`inventory ${invBefore.issues.join(",")}`]};
  const solved=await solveStrip(working);
  if(!solved.ok)return solved;
  cleanupLegacyDuplicates(working);
  const invAfter=strictRoleInventory(working);
  if(!invAfter.ok)return{ok:false,issues:[`inventory ${invAfter.issues.join(",")}`]};
  const nodes=stripNodes(working),check=await validateStrip(working,nodes,stripSpec(working));
  if(!check.ok)return check;
  await commitWorkingStrip(real,working,master);
  meta(real,"layoutStatus","valid");meta(real,"layoutIssues","");
  return{ok:true,issues:[]};
 }finally{working.remove()}
}
function canonicalRoots(spec,campaignId){const all=campaignRoots(campaignId),used=new Set(),out=[];for(const f of spec.formats||[]){let r=all.find(x=>!used.has(x.id)&&getMeta(x,"formatId")===f.formatId);if(!r)r=all.find(x=>!used.has(x.id)&&Math.round(x.width)===Math.round(f.width)&&Math.round(x.height)===Math.round(f.height));if(r){used.add(r.id);out.push(r)}}return out}

const RUNTIME_INTEGRITY_OK=typeof syncText==="function"&&typeof adaptNewLayer==="function"&&typeof cloneInto==="function"&&typeof syncMotion==="function"&&typeof syncExisting==="function";
async function updateResizes({includeFormatIds=null,useAi=false}={}){if(!RUNTIME_INTEGRITY_OK)throw Error("Plugin build is incomplete: sync runtime helpers are missing.");
 const c=await currentConnection();if(!c)throw Error("Connect a campaign first");
 const master=await ensureMaster(c.spec.campaignId);if(!master)throw Error("No Master format found");
 migrateLegacyRoles(master);ensureHeroRole(master);prepareMasterSlots(master);cleanupLegacyDuplicates(master);
 let targets=canonicalRoots(c.spec,c.spec.campaignId).filter(r=>r.id!==master.id);
 if(Array.isArray(includeFormatIds)){const allowed=new Set(includeFormatIds);targets=targets.filter(r=>allowed.has(getMeta(r,"formatId")))}
 let created=0,updated=0,tracks=0,aiReviewed=0,invalid=0,stripValid=0,stripInvalid=0;
 const stripErrors=[];
 for(const root of targets){
  if(familyFor(root.width,root.height)==="Strip"){
   const r=await transactionalStrip(master,root);
   if(r.ok){stripValid++;if(useAi&&await aiPolish(master,root,c.token))aiReviewed++;tracks+=await syncFinalMotion(master,root)}else{stripInvalid++;invalid++;stripErrors.push(`${Math.round(root.width)}×${Math.round(root.height)}: ${r.issues.join("; ")}`)}
   continue;
  }
  const s=await syncMasterIntoRoot(master,root);created+=s.created;updated+=s.updated;tracks+=s.tracks;
  await smartLayout(root);const score=layoutScore(root);if(score>1)invalid++;if(useAi&&score<=1&&await aiPolish(master,root,c.token))aiReviewed++;tracks+=await syncFinalMotion(master,root);
 }
 return{master:masterState(master),targets:targets.length,created,updated,tracks,aiReviewed,invalid,stripValid,stripInvalid,stripErrors};
}

async function currentConnection(){const token=await figma.clientStorage.getAsync(TOKEN_KEY);if(!token)return null;try{return{token,spec:await request("/api/figma/campaign",{token})}}catch{await figma.clientStorage.deleteAsync(TOKEN_KEY);return null}}
async function pair(code){const r=await request("/api/figma/pair/claim",{method:"POST",body:{code}});await figma.clientStorage.setAsync(TOKEN_KEY,r.token);const synced=await syncFromCloud(r.token);await ensureMaster(synced.spec.campaignId);return{...r,synced}}
function visibleChildren(root){
 return (root.children||[]).filter(n=>n.visible!==false);
}
async function exportViaFrame(root){
 const frame=figma.createFrame();
 frame.name=`__bm_export_${root.name}`;
 frame.resize(Math.max(1,root.width),Math.max(1,root.height));
 frame.x=root.x+100000;frame.y=root.y;
 frame.clipsContent=true;frame.visible=true;
 try{
  if(root.fills!==figma.mixed&&Array.isArray(root.fills)&&root.fills.length)frame.fills=clone(root.fills);
  else frame.fills=[{type:"SOLID",color:{r:1,g:1,b:1}}];
 }catch{frame.fills=[{type:"SOLID",color:{r:1,g:1,b:1}}]}
 for(const child of visibleChildren(root)){
  try{const c=child.clone();frame.appendChild(c)}catch{}
 }
 // Guarantee at least one visible exportable paint even if all children are hidden/unsupported.
 if(!visibleChildren(frame).length){
  const bg=figma.createRectangle();bg.resize(frame.width,frame.height);bg.x=0;bg.y=0;
  bg.fills=[{type:"SOLID",color:{r:1,g:1,b:1},opacity:0.001}];
  frame.appendChild(bg);
 }
 try{
  return await frame.exportAsync({format:"SVG_STRING",svgOutlineText:false,svgIdAttribute:true});
 }finally{frame.remove()}
}
async function safeExportRoot(root){
 const problems=[];
 try{
  if(root.visible!==false){
   const svg=await root.exportAsync({format:"SVG_STRING",svgOutlineText:false,svgIdAttribute:true});
   if(svg&&String(svg).includes("<svg"))return{svg,mode:"direct",problems};
  }else problems.push("root-hidden");
 }catch(error){problems.push(`direct:${error instanceof Error?error.message:String(error)}`)}
 try{
  const svg=await exportViaFrame(root);
  if(svg&&String(svg).includes("<svg"))return{svg,mode:"frame-fallback",problems};
 }catch(error){problems.push(`fallback:${error instanceof Error?error.message:String(error)}`)}
 throw Error(problems.join(" | ")||"Unknown export error");
}
async function publish(){
 const c=await currentConnection();if(!c)throw Error("Connect a campaign first");
 const roots=canonicalRoots(c.spec,c.spec.campaignId);
 if(!roots.length)throw Error("No canonical campaign formats found to publish");
 const formats=[],failures=[];
 for(const root of roots){
  const formatId=getMeta(root,"formatId"),label=`${Math.round(root.width)}×${Math.round(root.height)}`;
  try{
   const exported=await safeExportRoot(root);
   formats.push({
    formatId,
    previewType:"figma",
    previewSvg:exported.svg,
    durationSec:Number(getMeta(root,"duration")||6),
    variantRenders:{},
    exportMode:exported.mode
   });
  }catch(error){
   failures.push(`${label}: ${error instanceof Error?error.message:String(error)}`);
  }
 }
 if(failures.length)throw Error(`Export failed for ${failures.length} format(s): ${failures.join(" · ")}`);
 if(formats.length!==roots.length)throw Error(`Export incomplete: ${formats.length}/${roots.length} formats`);
 return request("/api/figma/creative-publish",{method:"POST",token:c.token,body:{formats}});
}
async function previewFormats(){
 const connection=await currentConnection();if(!connection)throw Error("Connect a campaign first");
 const previews=[];
 for(const root of canonicalRoots(connection.spec,connection.spec.campaignId)){
  let image=null,error=null;
  try{const bytes=await root.exportAsync({format:"PNG",constraint:{type:"SCALE",value:Math.min(1,480/Math.max(root.width,root.height))}});image=`data:image/png;base64,${figma.base64Encode(bytes)}`}
  catch(e){error=e instanceof Error?e.message:String(e)}
  previews.push({formatId:getMeta(root,"formatId"),width:root.width,height:root.height,image,error});
 }
 return previews;
}
async function state(){const c=await currentConnection();let master=null,ms=null;if(c){master=await ensureMaster(c.spec.campaignId);ms=masterState(master);if(ms)ms.resizes=Math.max(0,canonicalRoots(c.spec,c.spec.campaignId).length-1)}return{connection:c?{campaignId:c.spec.campaignId,campaignName:c.spec.campaignName,formats:c.spec.formats||[],placements:(c.spec.formats||[]).reduce((n,f)=>n+(f.placementIds?.length||0),0),mediaPlanVersion:c.spec.mediaPlanVersion,ttSnapshotVersion:c.spec.ttSnapshotVersion,creativeVersion:c.spec.creativeVersion}:null,master:ms}}
async function setSelectedAsMaster(){const s=figma.currentPage.selection||[];if(s.length!==1)throw Error("Select one format or a layer inside it");const r=formatRoot(s[0]);if(!r)throw Error("Selection is not inside a campaign format");const campaign=getMeta(r,"campaignId");for(const root of campaignRoots(campaign))meta(root,"isMaster",root.id===r.id?"true":"false");masterId=r.id;await ensureMaster(campaign);return masterState(r)}

figma.ui.onmessage=async m=>{try{
 if(m.type==="preview-formats"){figma.ui.postMessage({type:"format-previews",previews:await previewFormats()});return}
 if(m.type==="status"){figma.ui.postMessage({type:"status",...(await state())});return}
 if(m.type==="pair"){figma.ui.postMessage({type:"paired",result:await pair(String(m.code||"").replace(/\D/g,"")),...(await state())});return}
 if(m.type==="sync-formats"){const c=await currentConnection();if(!c)throw Error("Connect a campaign first");const result=await syncFromCloud(c.token);await ensureMaster(c.spec.campaignId);figma.ui.postMessage({type:"formats-synced",result,...(await state())});return}
 if(m.type==="update-resizes"){figma.ui.postMessage({type:"resizes-updated",result:await updateResizes({includeFormatIds:m.includeFormatIds||null,useAi:Boolean(m.useAi)}),...(await state())});return}
 if(m.type==="set-hero"){const s=figma.currentPage.selection||[];if(s.length!==1)throw Error("Select one image layer");const root=formatRoot(s[0]);if(!root)throw Error("Selected layer is not inside a campaign format");setRole(s[0],"hero.primary");meta(s[0],"managedBy","bannermatic");figma.ui.postMessage({type:"hero-set",name:s[0].name});return}
 if(m.type==="set-master"){figma.ui.postMessage({type:"master-set",master:await setSelectedAsMaster()});return}
 if(m.type==="publish"){figma.ui.postMessage({type:"published",result:await publish()});return}
 if(m.type==="disconnect"){await figma.clientStorage.deleteAsync(TOKEN_KEY);masterId="";figma.ui.postMessage({type:"disconnected"});return}
 }catch(e){figma.ui.postMessage({type:"error",message:e instanceof Error?e.message:String(e)})}}
