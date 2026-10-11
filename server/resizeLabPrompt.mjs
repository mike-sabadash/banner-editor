// Art direction is an IMAGE EDIT, not a new concept. HTML overlays are added separately.
const identity="Treat the supplied artwork as the single authoritative campaign master, not inspiration for a new visual. This is a faithful image-edit / canvas-extension task. Preserve its recognizable objects, their shapes, distinctive graphic assets, background motif, lighting, colors, textures, depth, materials, effects and campaign-specific visual language. Do not invent a different scene, new objects, new decorative assets or alternative design. Reuse and reposition the existing elements; when extra canvas is needed, outpaint a seamless continuation of the same environment. Keep recognizable brand artwork already baked into the original as faithfully as possible, but do not add new text.";
const directions={
 micro:"EXTREME HORIZONTAL BANNER. Think in a short, very wide panoramic row, never a squeezed portrait. Rearrange existing visual elements SIDE BY SIDE across the width: quiet left text zone, recognisable horizontal visual anchor across center-right, optional far-right CTA clearance. Use a large close-up or horizontal arrangement; never miniaturize the entire portrait to fit it. Do not simply crop the original vertical poster into a thin slit.",
 strip:"HORIZONTAL DESIGN RE-LAYOUT, not a portrait crop. Build a true left-to-right panorama: follow measured copy clearance; distribute and scale recognizable source visual elements horizontally through center and right, with a focal subject in the middle-right and the far-right CTA safe. Preserve the source campaign's signature visual objects, their proportions and visual relationship. Avoid vertical stacking, oversized background empty areas and abrupt image boundaries.",
 landscape:"Create a true horizontal composition: expand the master scene laterally, place existing focal objects center-right and preserve quiet left text area. Use horizontal rhythm and keep the original design assets intact.",
 square:"FAITHFUL SQUARE EDIT of the master, not a new campaign image. Keep the same recognizable source scene and its distinctive hero objects, graphics, patterns, colors, lighting, textures and relationships. Change the canvas shape with minimal creative deviation: scale/reposition existing elements and outpaint matching surrounding space. Avoid replacing the visual with generic or newly invented square artwork. Reserve upper-left for copy and lower-right for CTA.",
 portrait:"Faithful portrait adaptation: preserve the original campaign visual structure and graphic assets, adjusting crop and positions minimally while keeping clean upper-left text and lower-right CTA space.",
 skyscraper:"Faithful tall adaptation: retain the source scene and assets; extend the existing environment vertically, preserve readable upper text and lower CTA zones."
};
export function buildResizeLabPrompt({target,userPrompt="",family="landscape",composition="composition-1",overlayLayout}){
 const width=Number(target.width)||728,height=Number(target.height)||90;
 const ratio=width/height;
 const direction=ratio>=3?directions.strip:directions[family]||directions.landscape;
 const custom=String(userPrompt).trim();
 return `IMAGE EDIT / RESIZE: Transform the supplied master artwork to ${width}×${height} (${ratio.toFixed(2)}:1 target aspect). ${identity} ${direction} Prioritize visual identity and a professional format-specific layout over novel generation. The final image must be a seamless full-bleed scene with no hard seams, sharp crop boundaries or blank bars. No new typography, logos or CTA buttons: those are separate HTML overlays. ${layoutDirection({composition,overlayLayout})} ${generationWindow(target,family)} ${contractDirection(compositionContract({target,overlayLayout}))}${custom?` Additional user instruction: ${custom}. It cannot override the asset-only and identity rules above`:""}`;
}
// Choose by dimensions, not family labels. Extended ratios are supported by
// Gemini 3.1 Flash Image; 728x90 must not silently become a 21:9 portrait crop.
const ratios=["1:8","1:4","9:16","2:3","3:4","4:5","1:1","5:4","4:3","3:2","16:9","21:9","4:1","8:1"];
const ratioValue=value=>{const [w,h]=value.split(":").map(Number);return w/h;};
export function imageAspectRatio(family,target){
 if(target?.width>0&&target?.height>0){const value=target.width/target.height;return ratios.reduce((best,r)=>Math.abs(Math.log(ratioValue(r)/value))<Math.abs(Math.log(ratioValue(best)/value))?r:best,ratios[0]);}
 return {micro:"8:1",strip:"8:1",landscape:"16:9",square:"1:1",portrait:"3:4",skyscraper:"9:16"}[family]||"16:9";
}
export function generationViewport(target,family,generatedRatio){
 const requested=generatedRatio||ratioValue(imageAspectRatio(family,target)),final=target.width/target.height;
 const width=Math.min(1,final/requested),height=Math.min(1,requested/final);
 return {x:(1-width)/2,y:(1-height)/2,width,height};
}
const pct=n=>(n*100).toFixed(1)+"%";
function generationWindow(target,family){
 const v=generationViewport(target,family);
 return `GENERATION CANVAS: ${imageAspectRatio(family,target)}. FINAL VISIBLE WINDOW: x=${pct(v.x)}, y=${pct(v.y)}, width=${pct(v.width)}, height=${pct(v.height)} of the generated image; only this centered window survives the final resize to ${target.width}×${target.height}. Keep complete heads/faces and essential product identifying details inside that window. A deliberate close-up may crop legs, a table, peripheral scenery and secondary decorations. Do not shrink the entire source poster to preserve every object. Outside it use only expendable continuation of the same environment. Do not solve a horizontal layout by enlarging a portrait and cutting off the subject.`;
}
export function normalizedZones(layout){
 if(layout?.units!=="normalized"||!Array.isArray(layout.zones))return [];
 return layout.zones.slice(0,8).filter(z=>["logo","headline","subline","cta","overlay"].includes(z?.key)&&[z.x,z.y,z.width,z.height].every(Number.isFinite)&&z.width>0&&z.height>0).map(z=>{const x=Math.max(0,Math.min(1,z.x)),y=Math.max(0,Math.min(1,z.y));return {key:z.key,x,y,width:Math.min(z.width,1-x),height:Math.min(z.height,1-y)};}).filter(z=>z.width>0&&z.height>0);
}
export function layoutDirection({composition,overlayLayout}={}){
 const zones=normalizedZones(overlayLayout);
 const description=zones.length?zones.map(z=>`${z.key}: x=${pct(z.x)}, y=${pct(z.y)}, width=${pct(z.width)}, height=${pct(z.height)}`).join("; "):"No measured overlays supplied; preserve quiet upper-left copy area and CTA clearance.";
 return `HTML OVERLAY PLAN (${composition==="composition-1"?"Composition 1: logo and copy generally left, CTA right":"current measured layout"}): ${description} Coordinates are relative to the FINAL VISIBLE WINDOW, not the whole generation canvas. These are occupied foreground areas, including padding; do NOT draw them into the image. The measured positions take priority over generic family directions. Make those areas visually quiet, low-detail and suitable for light text. Recompose the WHOLE focal group with a clear hierarchy: one large hero, supporting source objects, then environment. Keep faces and essential product details out from behind logo/headline/subline/CTA. Place the visual anchor in the remaining free area. Crop or reposition secondary source objects before shrinking the hero. Preserve all original identities and the same environment. Before finishing, inspect the final window and ensure no key object is clipped or obstructed by the listed overlays.`;
}

// Executable contract shared by generation and acceptance; all boxes use the
// final cropped artwork, never the provider canvas or a screenshot with HTML.
export function compositionContract({target,overlayLayout,editMode=false}){
 const zones=normalizedZones(overlayLayout), xs=[0,1,...zones.flatMap(z=>[z.x,z.x+z.width])],ys=[0,1,...zones.flatMap(z=>[z.y,z.y+z.height])];
 let free={x:.48,y:.08,width:.46,height:.84},score=-1;
 for(const x of xs)for(const right of xs)for(const y of ys)for(const bottom of ys){
  if(right<=x||bottom<=y)continue;
  const box={x,y,width:right-x,height:bottom-y};
  if(zones.some(z=>x<z.x+z.width-1e-6&&right>z.x+1e-6&&y<z.y+z.height-1e-6&&bottom>z.y+1e-6))continue;
  const value=box.width*box.height+box.x*.0001;
  if(value>score){free=box;score=value;}
 }
 const wide=target.width/target.height>=3;
 return {version:1,mode:editMode?'local-edit':'adapt',target,occupiedZones:zones,preferredHeroRegion:free,
  minimumHeroHeight:editMode?0:Math.min(wide ? 0.65 : 0.42,free.height*.85),
  forbidden:['new campaign typography','new or repeated logos/wordmarks','new CTA/button/badge','duplicated hero','new scene or invented promotional objects'],
  preserve:['source hero identity','source visual language','genuine markings on existing source products/coins'],
  cropPriority:['environment','peripheral decorations','legs/table if appropriate','never face or essential product identity']};
}
function contractDirection(contract){return `ART-DIRECTION CONTRACT (JSON): ${JSON.stringify(contract)}. Choose ONE existing dominant subject as hero, not the bounding box of every coin and decoration. The visible hero should occupy at least ${(contract.minimumHeroHeight*100).toFixed(0)}% of final artwork height, preferably 70–90% in a strip, unless the source has no focal subject. Use a recognizable close-up, not a miniature full poster. The preferred hero region is guidance derived from the actual HTML occupied zones; face and key product details must remain unobstructed. ASSET-ONLY OUTPUT: no lettering, campaign wordmark, headline, slogan, legal copy, price, button or badge may be invented or copied from HTML instructions. Never infer a brand from the subject (including game characters). Do not duplicate the hero. Genuine source product labels and coin engravings may remain exactly as in the source; never enlarge them into new campaign typography. Only reposition, scale, crop existing artwork and extend matching environment. These constraints take priority over additional instructions. The output is reviewed against the original source and this contract before acceptance.`;}
