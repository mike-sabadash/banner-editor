const NS="banner_campaign";
const FORMAT_DEFS=[
  {id:"master",width:1200,height:628,family:"Rectangle"},
  {id:"medium",width:300,height:250,family:"Rectangle"},
  {id:"half",width:300,height:600,family:"Vertical"},
  {id:"leader",width:728,height:90,family:"Strip"},
  {id:"mobile",width:320,height:50,family:"Strip"}
];
const SLOT_CATALOG={
  background:{id:"background",label:"Background",kind:"visual",system:true},
  logo:{id:"logo",label:"Logo",kind:"visual",system:true},
  hero:{id:"hero",label:"Hero",kind:"visual",system:true},
  headline:{id:"headline",label:"Headline",kind:"text",system:true},
  copy:{id:"copy",label:"Copy",kind:"text",system:true},
  cta:{id:"cta",label:"CTA",kind:"visual",system:true,required:true},
  legal:{id:"legal",label:"Legal",kind:"text",system:true},
  tracking_pixel:{id:"tracking_pixel",label:"Tracking pixel",kind:"technical",system:true,required:true,technical:true}
};
const DEFAULT_SLOT_IDS=["background","headline","copy","cta","tracking_pixel"];
figma.showUI(__html__,{width:340,height:680,themeColors:true});
const meta=(n,k,v)=>n.setSharedPluginData(NS,k,v),getMeta=(n,k)=>n.getSharedPluginData(NS,k);
const copy=v=>v==null?v:JSON.parse(JSON.stringify(v));
const rgb=h=>{let v=h.replace("#","").trim();if(v.length===3)v=v.split("").map(c=>c+c).join("");if(v.length!==6)throw new Error(`Invalid hex color: ${h}`);return{r:parseInt(v.slice(0,2),16)/255,g:parseInt(v.slice(2,4),16)/255,b:parseInt(v.slice(4,6),16)/255}};
const slug=s=>(s||"layer").trim().toLowerCase().replace(/[^a-z0-9а-яё]+/gi,"-").replace(/^-|-$/g,"")||"layer";
function defaultRegistry(){return DEFAULT_SLOT_IDS.map(id=>copy(SLOT_CATALOG[id]));}
function formatRoot(n){let c=n;while(c&&c!==figma.currentPage){if(getMeta(c,"formatId"))return c;c=c.parent}return null}
function campaignIdFor(n){const r=n&&(getMeta(n,"formatId")?n:formatRoot(n));return r?getMeta(r,"campaignId"):""}
function allRoots(){return figma.currentPage.findAll(n=>n.type==="COMPONENT"&&getMeta(n,"formatId")&&getMeta(n,"campaignId"))}
function rootsForCampaign(id){return allRoots().filter(r=>getMeta(r,"campaignId")===id)}
function selectedCampaignId(){const selected=figma.currentPage.selection[0];const fromSelection=selected&&campaignIdFor(selected);if(fromSelection)return fromSelection;const roots=allRoots();const ids=[...new Set(roots.map(r=>getMeta(r,"campaignId")))];return ids.length===1?ids[0]:""}
function registryForRoot(root){try{const raw=getMeta(root,"slotRegistry");if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))return parsed}}catch{}return defaultRegistry()}
function registryForCampaign(id){const root=rootsForCampaign(id)[0];return root?registryForRoot(root):defaultRegistry()}
function writeRegistry(id,registry){const raw=JSON.stringify(registry);for(const root of rootsForCampaign(id))meta(root,"slotRegistry",raw)}
function ensureRegistrySlot(id,slot){const registry=registryForCampaign(id);if(!registry.some(s=>s.id===slot.id)){registry.push(copy(slot));writeRegistry(id,registry)}return registry}
async function addText(r,name,text,x,y,size,slot){await figma.loadFontAsync({family:"Inter",style:"Regular"});const n=figma.createText();n.name=name;n.fontName={family:"Inter",style:"Regular"};n.fontSize=size;n.characters=text;n.x=x;n.y=y;n.resize(Math.max(40,r.width-x*2),Math.max(size*1.4,20));meta(n,"slotId",slot);r.appendChild(n);return n}
function addShape(r,name,x,y,w,h,c,slot){const n=figma.createRectangle();n.name=name;n.resize(w,h);n.x=x;n.y=y;n.fills=[{type:"SOLID",color:rgb(c)}];meta(n,"slotId",slot);r.appendChild(n);return n}
function addTrackingPixel(r){const n=addShape(r,"Tracking pixel",Math.max(0,r.width-1),Math.max(0,r.height-1),1,1,"#000000","tracking_pixel");n.opacity=.01;n.locked=true;meta(n,"technicalRole","tracking_pixel");return n}
async function createCampaign(name,duration){
  await figma.currentPage.loadAsync();const id=`campaign-${Date.now()}`,roots=[];let x=0,y=0,row=0;const registry=defaultRegistry();
  for(const f of FORMAT_DEFS){
    const r=figma.createComponent();r.name=`${f.width}×${f.height}, ${f.family}`;r.resize(f.width,f.height);r.x=x;r.y=y;r.clipsContent=true;r.fills=[{type:"SOLID",color:rgb("#ffffff")}];
    for(const [k,v] of Object.entries({campaignId:id,campaignName:name,formatId:f.id,familyId:f.family,duration:String(duration),slotRegistry:JSON.stringify(registry)}))meta(r,k,v);
    const compact=f.height<=100,portrait=f.height>f.width;
    addShape(r,"Background",0,0,f.width,f.height,"#eef0ec","background");
    await addText(r,"Headline","Campaign headline",compact?18:Math.round(f.width*.08),compact?18:Math.round(f.height*.16),compact?18:Math.max(18,Math.round(f.width*.045)),"headline");
    if(!compact)await addText(r,"Copy","Campaign copy",Math.round(f.width*.08),portrait?Math.round(f.height*.34):Math.round(f.height*.42),Math.max(12,Math.round(f.width*.018)),"copy");
    addShape(r,"CTA",compact?f.width-110:Math.round(f.width*.08),compact?18:f.height-58,compact?92:130,compact?28:38,"#171812","cta");
    addTrackingPixel(r);
    roots.push(r);x+=f.width+80;row=Math.max(row,f.height);if(x>1900){x=0;y+=row+100;row=0}
  }
  figma.currentPage.selection=roots;figma.viewport.scrollAndZoomIntoView(roots);return id
}
function layerForSlot(root,slotId){return root.findAll(n=>getMeta(n,"slotId")===slotId)[0]||null}
function linkSelection(slotId){
  const campaign=selectedCampaignId();if(!campaign)return{count:0,error:"Select a layer inside one campaign first"};
  const registry=registryForCampaign(campaign);if(!registry.some(s=>s.id===slotId))return{count:0,error:"This campaign layer no longer exists"};
  let count=0;
  for(const n of figma.currentPage.selection){const root=formatRoot(n);if(!root||getMeta(root,"campaignId")!==campaign)continue;for(const old of root.findAll(x=>x.id!==n.id&&getMeta(x,"slotId")===slotId))meta(old,"slotId","");meta(n,"slotId",slotId);count++}
  return{count}
}
function addPresetSlot(presetId){const campaign=selectedCampaignId();if(!campaign)return{error:"Select a campaign format first"};const preset=SLOT_CATALOG[presetId];if(!preset)return{error:"Unknown preset"};const registry=registryForCampaign(campaign);if(registry.some(s=>s.id===presetId))return{error:`${preset.label} already exists in this campaign`};registry.push(copy(preset));writeRegistry(campaign,registry);return{slot:copy(preset)}}
function addCustomSlot(label,kind){const campaign=selectedCampaignId();if(!campaign)return{error:"Select a campaign format first"};const clean=(label||"").trim();if(!clean)return{error:"Enter a layer name"};const slot={id:`custom-${slug(clean)}-${Date.now().toString(36)}`,label:clean,kind:kind||"generic",system:false,custom:true};ensureRegistrySlot(campaign,slot);return{slot}}
function slotState(campaign,slot){const roots=rootsForCampaign(campaign),linked=roots.filter(r=>layerForSlot(r,slot.id));return{...slot,linkedCount:linked.length,totalCount:roots.length,missingCount:roots.length-linked.length,formats:roots.map(r=>({id:getMeta(r,"formatId"),name:r.name,linked:!!layerForSlot(r,slot.id)}))}}
function campaignState(){const campaign=selectedCampaignId();if(!campaign)return{campaignId:"",slots:[],presets:Object.values(SLOT_CATALOG).filter(s=>![...DEFAULT_SLOT_IDS].includes(s.id))};const roots=rootsForCampaign(campaign),registry=registryForCampaign(campaign);return{campaignId:campaign,campaignName:getMeta(roots[0],"campaignName")||"Campaign",formatCount:roots.length,slots:registry.map(s=>slotState(campaign,s)),presets:Object.values(SLOT_CATALOG).filter(s=>!registry.some(r=>r.id===s.id))}}
function postCampaignState(){figma.ui.postMessage({type:"campaign-state",state:campaignState()})}
function cloneIntoRoot(source,sourceRoot,targetRoot,slot){const clone=source.clone();targetRoot.appendChild(clone);meta(clone,"slotId",slot.id);const rx=sourceRoot.width?source.x/sourceRoot.width:0,ry=sourceRoot.height?source.y/sourceRoot.height:0;clone.x=Math.max(0,Math.min(targetRoot.width-Math.min(clone.width,targetRoot.width),rx*targetRoot.width));clone.y=Math.max(0,Math.min(targetRoot.height-Math.min(clone.height,targetRoot.height),ry*targetRoot.height));if(slot.technical){clone.resize(1,1);clone.x=Math.max(0,targetRoot.width-1);clone.y=Math.max(0,targetRoot.height-1);clone.opacity=.01;clone.locked=true;meta(clone,"technicalRole","tracking_pixel")}return clone}
function createMissing(slotId){const campaign=selectedCampaignId();if(!campaign)return{count:0,error:"Select this campaign first"};const registry=registryForCampaign(campaign),slot=registry.find(s=>s.id===slotId);if(!slot)return{count:0,error:"Campaign layer not found"};const roots=rootsForCampaign(campaign),sourceRoot=roots.find(r=>layerForSlot(r,slotId)),source=sourceRoot&&layerForSlot(sourceRoot,slotId);if(!source)return{count:0,error:`Link ${slot.label} in one format first`};let count=0;for(const root of roots){if(layerForSlot(root,slotId))continue;cloneIntoRoot(source,sourceRoot,root,slot);count++}return{count}}
const FIELDS=["TRANSLATION_X","TRANSLATION_Y","TRANSLATION_XY","OPACITY","ROTATION","SCALE_X","SCALE_Y","SCALE_XY","WIDTH","HEIGHT"];
const GEOMETRY=new Set(["TRANSLATION_X","TRANSLATION_Y","TRANSLATION_XY","SCALE_X","SCALE_Y","SCALE_XY","WIDTH","HEIGHT"]),APPEARANCE=new Set(["OPACITY","ROTATION"]);
function hasMotion(n){const m=n.manualKeyframeTracks||{},a=n.animations||{};return(n.animationStyles||[]).length>0||FIELDS.some(f=>m[f]||a[f])}
function resolveSource(slot){const selected=figma.currentPage.selection[0],root=selected?(getMeta(selected,"formatId")?selected:formatRoot(selected)):null,campaign=root?getMeta(root,"campaignId"):selectedCampaignId();if(selected&&getMeta(selected,"slotId")===slot&&hasMotion(selected))return selected;const hits=figma.currentPage.findAll(n=>getMeta(n,"slotId")===slot&&(!campaign||campaignIdFor(n)===campaign)&&hasMotion(n));if(hits.length===1)return hits[0];if(root){const local=root.findAll(n=>getMeta(n,"slotId")===slot);if(local.length===1)return local[0]}return null}
function targetBase(f,n,b){if(f==="TRANSLATION_X")return{type:"FLOAT",value:n.x};if(f==="TRANSLATION_Y")return{type:"FLOAT",value:n.y};if(f==="TRANSLATION_XY")return{type:"VECTOR",value:{x:n.x,y:n.y}};return copy(b)}
function offsetValue(v,sb,tb){if(!v||!sb||!tb)return copy(v);if(typeof v.value==="number"&&typeof sb.value==="number"&&typeof tb.value==="number")return{type:v.type,value:tb.value+(v.value-sb.value)};if(v.value&&sb.value&&tb.value)return{type:v.type,value:{x:tb.value.x+(v.value.x-sb.value.x),y:tb.value.y+(v.value.y-sb.value.y)}};return copy(v)}
function effective(f,source){const manual=(source.manualKeyframeTracks||{})[f];if(manual)return copy(manual);const a=(source.animations||{})[f];if(!a)return null;const keys=[];for(const tr of a.tracks||[])for(const k of tr.keyframes||[])keys.push({timelinePosition:k.timelinePosition,easing:copy(k.easing),value:copy(k.value)});return keys.length?{baseValue:copy(a.baseValue),keyframes:keys}:null}
function activeMotionFields(source){const direct=new Set(FIELDS.filter(f=>effective(f,source)));if(direct.has("TRANSLATION_XY")){direct.delete("TRANSLATION_X");direct.delete("TRANSLATION_Y")}if(direct.has("SCALE_XY")){direct.delete("SCALE_X");direct.delete("SCALE_Y")}return direct}
function mergeBinding(sb,tb,target,f,parts){if(!sb)return null;const useGeometry=parts.includes("geometry"),useTiming=parts.includes("timing"),useEasing=parts.includes("easing"),isGeo=GEOMETRY.has(f);if(isGeo&&!useGeometry&&tb){const out=copy(tb),sk=sb.keyframes||[],tk=out.keyframes||[];for(let i=0;i<tk.length;i++){if(useTiming&&sk[i])tk[i].timelinePosition=sk[i].timelinePosition;if(useEasing&&sk[i])tk[i].easing=copy(sk[i].easing)}return out}const base=targetBase(f,target,sb.baseValue),out={baseValue:base,keyframes:(sb.keyframes||[]).map(k=>({timelinePosition:k.timelinePosition,easing:copy(k.easing),value:isGeo?offsetValue(k.value,sb.baseValue,base):copy(k.value)}))};if(!useTiming&&tb)out.keyframes.forEach((k,i)=>{if(tb.keyframes&&tb.keyframes[i])k.timelinePosition=tb.keyframes[i].timelinePosition});if(!useEasing&&tb)out.keyframes.forEach((k,i)=>{if(tb.keyframes&&tb.keyframes[i])k.easing=copy(tb.keyframes[i].easing)});return out}
async function syncContent(source,target,parts){if(parts.includes("content")){if(source.type==="TEXT"&&target.type==="TEXT"){if(source.fontName!==figma.mixed)await figma.loadFontAsync(source.fontName);target.characters=source.characters}else if("fills" in source&&"fills" in target&&source.fills!==figma.mixed)target.fills=copy(source.fills)}if(parts.includes("layout")){target.x=source.x;target.y=source.y;if("resize" in target)target.resize(source.width,source.height)}}
async function granularSync(scope,slot,parts){const source=resolveSource(slot);if(!source)return{count:0,error:`No unique source found for this layer. Select its source once.`};const sr=formatRoot(source);if(!sr)return{count:0,error:"Source is not inside a campaign format"};const campaign=getMeta(sr,"campaignId"),family=getMeta(sr,"familyId"),selectedRoots=new Set(figma.currentPage.selection.map(formatRoot).filter(Boolean).map(n=>n.id)),sourceFields=activeMotionFields(source);let count=0;for(const target of figma.currentPage.findAll(n=>getMeta(n,"slotId")===slot)){if(target.id===source.id)continue;const tr=formatRoot(target);if(!tr||getMeta(tr,"campaignId")!==campaign)continue;if(scope==="family"&&getMeta(tr,"familyId")!==family)continue;if(scope==="selected"&&!selectedRoots.has(tr.id))continue;await syncContent(source,target,parts);if(parts.some(p=>["motionType","timing","easing","geometry","appearance"].includes(p))){for(const f of sourceFields){if(APPEARANCE.has(f)&&!parts.includes("appearance")&&!parts.includes("motionType"))continue;if(GEOMETRY.has(f)&&!parts.includes("motionType")&&!parts.includes("geometry")&&!parts.includes("timing")&&!parts.includes("easing"))continue;const sb=effective(f,source);if(!sb)continue;const merged=mergeBinding(sb,effective(f,target),target,f,parts);if(merged)target.applyManualKeyframeTrack({type:"PROPERTY",name:f},merged)}}count++}return{count,sourceName:source.name,preservedGeometry:!parts.includes("geometry")&&!parts.includes("layout"),fields:[...sourceFields]}}
function hex(p){return p&&p.type==="SOLID"?`#${[p.color.r,p.color.g,p.color.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("")}`:undefined}
async function exportLayer(n,r){if(n.visible===false)return null;const b=n.absoluteBoundingBox,rb=r.absoluteBoundingBox;if(!b||!rb)return null;const common={id:n.id,slotId:getMeta(n,"slotId")||undefined,name:n.name,x:b.x-rb.x,y:b.y-rb.y,width:b.width,height:b.height,rotation:n.rotation||0,opacity:"opacity"in n?n.opacity:1,visible:n.visible,technicalRole:getMeta(n,"technicalRole")||undefined};if(n.type==="TEXT")return{...common,type:"TEXT",text:n.characters,fontSize:n.fontSize!==figma.mixed?n.fontSize:16,color:n.fills!==figma.mixed?hex(n.fills[0]):undefined};if(getMeta(n,"technicalRole")==="tracking_pixel")return{...common,type:"TRACKING_PIXEL"};return null}
async function exportCampaign(){const roots=allRoots();if(!roots.length)throw Error("No campaign formats");const campaign=selectedCampaignId()||getMeta(roots[0],"campaignId"),formats=[];for(const r of roots.filter(x=>getMeta(x,"campaignId")===campaign)){const layers=[];for(const n of r.findAll(x=>x.type==="TEXT"||getMeta(x,"technicalRole"))){const l=await exportLayer(n,r);if(l)layers.push(l)}formats.push({id:getMeta(r,"formatId"),name:r.name,width:r.width,height:r.height,duration:Number(getMeta(r,"duration")||6),layers})}return{schema:"banner-campaign/figma-v2",campaign:{id:campaign,name:getMeta(rootsForCampaign(campaign)[0],"campaignName")||"Campaign",slots:registryForCampaign(campaign)},formats}}
figma.on("selectionchange",()=>postCampaignState());
figma.ui.onmessage=async m=>{try{
  if(m.type==="create"){figma.ui.postMessage({type:"created",id:await createCampaign(m.name||"Untitled",Number(m.duration)||6)});postCampaignState()}
  if(m.type==="get-campaign-state")postCampaignState();
  if(m.type==="link"){figma.ui.postMessage({type:"linked",...linkSelection(m.slotId)});postCampaignState()}
  if(m.type==="add-preset-slot"){figma.ui.postMessage({type:"slot-added",...addPresetSlot(m.presetId)});postCampaignState()}
  if(m.type==="add-custom-slot"){figma.ui.postMessage({type:"slot-added",...addCustomSlot(m.label,m.kind)});postCampaignState()}
  if(m.type==="create-missing"){figma.ui.postMessage({type:"missing-created",...createMissing(m.slotId)});postCampaignState()}
  if(m.type==="granular-sync")figma.ui.postMessage({type:"granular-synced",...(await granularSync(m.scope,m.slotId,m.parts||[]))});
  if(m.type==="export")figma.ui.postMessage({type:"exported",document:await exportCampaign()})
}catch(e){figma.ui.postMessage({type:"error",message:e instanceof Error?e.message:String(e)})}};
postCampaignState();