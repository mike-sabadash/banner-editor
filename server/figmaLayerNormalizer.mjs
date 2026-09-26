const supportedSimple=new Set(["TEXT","RECTANGLE","ELLIPSE","VECTOR","LINE","POLYGON","STAR"]);
const containerTypes=new Set(["FRAME","GROUP","COMPONENT","INSTANCE","SECTION"]);
const box=n=>n?.absoluteBoundingBox||n?.absoluteRenderBounds||{x:0,y:0,width:0,height:0};
const pct=(v,total)=>total?100*v/total:0;
const solidColor=paint=>{if(!paint||paint.type!=="SOLID")return undefined;const c=paint.color||{},a=paint.opacity??c.a??1;return `rgba(${Math.round((c.r||0)*255)},${Math.round((c.g||0)*255)},${Math.round((c.b||0)*255)},${a})`};
const visiblePaint=n=>(n?.fills||[]).find(p=>p?.visible!==false);
const hasImage=n=>(n?.fills||[]).some(p=>p?.visible!==false&&p?.type==="IMAGE");
const unsupported=n=>Boolean((n.effects||[]).some(e=>e?.visible!==false)||!["PASS_THROUGH","NORMAL",undefined].includes(n.blendMode)||n.isMask||n.type==="BOOLEAN_OPERATION"||n.type==="COMPONENT_SET"||n.type==="SLICE");
const relBox=(n,root)=>{const b=box(n),r=box(root);return{x:pct(b.x-r.x,r.width),y:pct(b.y-r.y,r.height),w:pct(b.width,r.width),h:pct(b.height,r.height)}};
const base=(n,root,z)=>({figmaNodeId:n.id,name:n.name||n.type,nodeType:n.type,zIndex:z,opacity:n.opacity??1,rotation:n.rotation||0,box:relBox(n,root),blendMode:n.blendMode||"NORMAL",effects:(n.effects||[]).filter(e=>e?.visible!==false),isMask:Boolean(n.isMask)});
function fallback(n,root,z,reason){return{...base(n,root,z),kind:"fallback",reason,exportNodeId:n.id,preserveVisual:true}}
function normalizeNode(n,root,z){if(unsupported(n))return fallback(n,root,z,"unsupported-effects-mask-blend-or-node");const common=base(n,root,z);
 if(n.type==="TEXT")return{...common,kind:"text",text:n.characters||"",style:{fontFamily:n.style?.fontFamily,fontWeight:n.style?.fontWeight,fontSize:n.style?.fontSize,textAlignHorizontal:n.style?.textAlignHorizontal,lineHeightPx:n.style?.lineHeightPx,letterSpacing:n.style?.letterSpacing,fill:solidColor(visiblePaint(n))},editable:true};
 if(hasImage(n)){const paint=visiblePaint(n);return{...common,kind:"image",imageRef:paint?.imageRef,scaleMode:paint?.scaleMode||"FILL",imageTransform:paint?.imageTransform,crop:paint?.imageTransform?{imageTransform:paint.imageTransform}:undefined,asset:{origin:"figma",vector:false,sourceWidth:Math.round(box(n).width),sourceHeight:Math.round(box(n).height)},shape:n.type};}
 if(["VECTOR","LINE","POLYGON","STAR"].includes(n.type))return{...common,kind:"vector",exportNodeId:n.id,asset:{origin:"figma",vector:true,mimeType:"image/svg+xml"}};
 if(n.type==="RECTANGLE"||n.type==="ELLIPSE")return{...common,kind:"shape",shape:n.type==="ELLIPSE"?"ellipse":"rectangle",fill:solidColor(visiblePaint(n)),strokes:n.strokes||[],cornerRadius:n.cornerRadius};
 return null}
export function normalizeFigmaFrame(frame){if(!frame||!frame.id)throw new Error("Figma frame is required");const layers=[],groups=[];let z=0;const walk=(node,parentId)=>{for(const child of node.children||[]){const currentZ=z++;if(containerTypes.has(child.type)){groups.push({...base(child,frame,currentZ),parentId,kind:"group",layoutMode:child.layoutMode||"NONE"});if(unsupported(child)){layers.push(fallback(child,frame,currentZ,"unsupported-container"));continue}walk(child,child.id);continue}const normalized=supportedSimple.has(child.type)||hasImage(child)?normalizeNode(child,frame,currentZ):fallback(child,frame,currentZ,"unsupported-node-type");if(normalized)layers.push({...normalized,parentId})}};walk(frame,frame.id);return{frame:{id:frame.id,name:frame.name||"Frame",width:box(frame).width,height:box(frame).height},layers,groups,requiresFallback:layers.some(l=>l.kind==="fallback")}}
export function normalizeFigmaNodeResponse(response,nodeIds=[]){const nodes=response?.nodes||{};return nodeIds.map(id=>nodes[id]?.document).filter(Boolean).map(normalizeFigmaFrame)}
