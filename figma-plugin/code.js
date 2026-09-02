const NS="banner_campaign";
const FORMAT_DEFS=[
  {id:"master",name:"Master",width:1200,height:628,family:"Rectangle"},
  {id:"medium",name:"Medium rectangle",width:300,height:250,family:"Rectangle"},
  {id:"half",name:"Half page",width:300,height:600,family:"Vertical"},
  {id:"leader",name:"Leaderboard",width:728,height:90,family:"Strip"},
  {id:"mobile",name:"Mobile banner",width:320,height:50,family:"Strip"},
];
figma.showUI(__html__,{width:340,height:590,themeColors:true});
const meta=(node,key,value)=>node.setSharedPluginData(NS,key,value);
const getMeta=(node,key)=>node.getSharedPluginData(NS,key);
const rgb=(hex)=>{const value=hex.replace("#","");return{r:parseInt(value.slice(0,2),16)/255,g:parseInt(value.slice(2,4),16)/255,b:parseInt(value.slice(4,6),16)/255}};
const hex=(paint)=>paint&&paint.type==="SOLID"?`#${[paint.color.r,paint.color.g,paint.color.b].map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("")}`:undefined;
const campaignNodes=()=>figma.currentPage.findAll(node=>getMeta(node,"campaignId")!=="");

async function addText(component,name,text,x,y,size,slotId){await figma.loadFontAsync({family:"Inter",style:"Regular"});const node=figma.createText();node.name=name;node.characters=text;node.fontName={family:"Inter",style:"Regular"};node.fontSize=size;node.x=x;node.y=y;node.resize(Math.max(40,component.width-x*2),Math.max(size*1.4,20));meta(node,"slotId",slotId);component.appendChild(node);try{const property=component.addComponentProperty(name,"TEXT",text);node.componentPropertyReferences={characters:property}}catch{}return node}
function addShape(component,name,x,y,width,height,color,slotId){const node=figma.createRectangle();node.name=name;node.resize(width,height);node.x=x;node.y=y;node.fills=[{type:"SOLID",color:rgb(color)}];meta(node,"slotId",slotId);component.appendChild(node);return node}

async function createCampaign(name,duration){await figma.currentPage.loadAsync();const campaignId=`campaign-${Date.now()}`;const components=[];let x=0,y=0,rowHeight=0;
  for(const format of FORMAT_DEFS){const component=figma.createComponent();component.name=`Format=${format.width}x${format.height}, Family=${format.family}`;component.resize(format.width,format.height);component.x=x;component.y=y;component.clipsContent=true;component.fills=[{type:"SOLID",color:rgb("#ffffff")}];meta(component,"campaignId",campaignId);meta(component,"formatId",format.id);meta(component,"familyId",format.family);meta(component,"duration",String(duration));
    const compact=format.height<=100,portrait=format.height>format.width;
    addShape(component,"Background",0,0,format.width,format.height,"#eef0ec","background");
    await addText(component,"Headline","Campaign headline",compact?18:Math.round(format.width*.08),compact?18:Math.round(format.height*.16),compact?18:Math.max(18,Math.round(format.width*.045)),"headline");
    if(!compact)await addText(component,"Copy","Campaign copy",Math.round(format.width*.08),portrait?Math.round(format.height*.34):Math.round(format.height*.42),Math.max(12,Math.round(format.width*.018)),"copy");
    const cta=addShape(component,"CTA",compact?format.width-110:Math.round(format.width*.08),compact?18:format.height-58,compact?92:130,compact?28:38,"#171812","cta");try{const prop=component.addComponentProperty("Show CTA","BOOLEAN",true);cta.componentPropertyReferences={visible:prop}}catch{}
    components.push(component);x+=format.width+80;rowHeight=Math.max(rowHeight,format.height);if(x>1900){x=0;y+=rowHeight+100;rowHeight=0}
  }
  const set=figma.combineAsVariants(components,figma.currentPage);set.name=`${name} · Banner formats`;meta(set,"campaignId",campaignId);meta(set,"campaignName",name);set.x=0;set.y=0;figma.currentPage.selection=[set];figma.viewport.scrollAndZoomIntoView([set]);return campaignId;
}

function linkSelection(slotId){for(const node of figma.currentPage.selection)if("setSharedPluginData" in node)meta(node,"slotId",slotId);return figma.currentPage.selection.length}
async function syncSelectedSlot(){const source=figma.currentPage.selection[0];if(!source)return{count:0,error:"Select one source layer"};const slotId=getMeta(source,"slotId");if(!slotId)return{count:0,error:"Assign a slot first"};let count=0;for(const node of figma.currentPage.findAll(n=>getMeta(n,"slotId")===slotId)){if(node.id===source.id)continue;if(source.type==="TEXT"&&node.type==="TEXT"){await figma.loadFontAsync(source.fontName);node.characters=source.characters;count++}else if("fills" in source&&"fills" in node&&source.fills!==figma.mixed){node.fills=source.fills;count++}}return{count}}

const easing=(value)=>{if(!value)return undefined;const result={type:value.type};if(value.easingFunctionCubicBezier)result.bezier=[value.easingFunctionCubicBezier.x1,value.easingFunctionCubicBezier.y1,value.easingFunctionCubicBezier.x2,value.easingFunctionCubicBezier.y2];return result};
function motionFor(node){const result={};const animations=node.animations||{};const add=(property,binding,convert=v=>v)=>{if(!binding)return;const keys=[];for(const track of binding.tracks||[])for(const key of track.keyframes||[]){let value=key.value&&key.value.value;if(typeof value!=="number")continue;const timing=easing(key.easing);keys.push({time:key.timelinePosition,value:convert(value),easing:timing&&timing.type,bezier:timing&&timing.bezier})}if(keys.length)result[property]=keys.sort((a,b)=>a.time-b.time)};
  add("opacity",animations.OPACITY,v=>v*100);add("rotation",animations.ROTATION);add("scale",animations.SCALE_XY,v=>v*100);
  add("x",animations.TRANSLATION_X);add("y",animations.TRANSLATION_Y);return result;
}
async function rasterUrl(node){try{const bytes=await node.exportAsync({format:"PNG",constraint:{type:"SCALE",value:1}});return`data:image/png;base64,${figma.base64Encode(bytes)}`}catch{return undefined}}
async function exportLayer(node,root){if(node.visible===false)return null;const box=node.absoluteBoundingBox,rootBox=root.absoluteBoundingBox;if(!box||!rootBox)return null;const common={id:node.id,slotId:getMeta(node,"slotId")||undefined,name:node.name,x:box.x-rootBox.x,y:box.y-rootBox.y,width:box.width,height:box.height,rotation:node.rotation||0,opacity:"opacity" in node?node.opacity:1,visible:node.visible,motion:motionFor(node)};
  if(node.type==="TEXT"){const font=node.fontName!==figma.mixed?node.fontName:undefined;return{...common,type:"TEXT",text:node.characters,fontFamily:font&&font.family,fontSize:node.fontSize!==figma.mixed?node.fontSize:16,color:node.fills!==figma.mixed?hex(node.fills[0]):undefined}}
  if("children" in node&&node.children.length)return null;return{...common,type:"IMAGE",assetUrl:await rasterUrl(node)};
}
async function exportCampaign(){await figma.currentPage.loadAsync();const components=campaignNodes().filter(node=>node.type==="COMPONENT"&&getMeta(node,"formatId"));if(!components.length)throw new Error("No Banner Campaign formats on this page");const campaignId=getMeta(components[0],"campaignId"),parent=components[0].parent;const name=parent&&getMeta(parent,"campaignName")||"Figma campaign";const exported=[];
  for(const root of components){const layers=[];for(const node of root.findAll(n=>n.type==="TEXT"||!("children" in n)||n.children.length===0)){const layer=await exportLayer(node,root);if(layer)layers.push(layer)}const fill=root.fills!==figma.mixed?hex(root.fills[0]):"#ffffff";exported.push({id:getMeta(root,"formatId"),name:root.name,width:root.width,height:root.height,duration:Number(getMeta(root,"duration")||root.timelines?.[0]?.duration||6),background:fill,layers})}
  return{schema:"banner-campaign/figma-v1",campaign:{id:campaignId,name},formats:exported};
}

figma.ui.onmessage=async message=>{try{if(message.type==="create"){const id=await createCampaign(message.name||"Untitled campaign",Number(message.duration)||6);figma.ui.postMessage({type:"created",id})}if(message.type==="link"){figma.ui.postMessage({type:"linked",count:linkSelection(message.slotId)})}if(message.type==="sync"){figma.ui.postMessage({type:"synced",...(await syncSelectedSlot())})}if(message.type==="export"){figma.ui.postMessage({type:"exported",document:await exportCampaign()})}}catch(error){figma.ui.postMessage({type:"error",message:error instanceof Error?error.message:String(error)})}};
