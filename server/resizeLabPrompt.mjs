// Art direction is an IMAGE EDIT, not a new concept. HTML overlays are added separately.
const identity="Treat the supplied artwork as the single authoritative campaign master, not inspiration for a new visual. This is a faithful image-edit / canvas-extension task. Preserve its recognizable objects, their shapes, arrangement, distinctive graphic assets, background motif, lighting, colors, textures, depth, materials, effects and campaign-specific visual language. Do not invent a different scene, new objects, new decorative assets or alternative design. Reuse and reposition the existing elements; when extra canvas is needed, outpaint a seamless continuation of the same environment. Keep recognizable brand artwork already baked into the original as faithfully as possible, but do not add new text.";
const directions={
 micro:"EXTREME HORIZONTAL BANNER. Think in a short, very wide panoramic row, never a squeezed portrait. Rearrange existing visual elements SIDE BY SIDE across the width: quiet left text zone, recognisable horizontal visual anchor across center-right, optional far-right CTA clearance. Reduce object scale rather than stacking vertically. Do not simply crop the original vertical poster into a thin slit.",
 strip:"HORIZONTAL DESIGN RE-LAYOUT, not a portrait crop. Build a true left-to-right panorama: reserve left 36% as calm text space; distribute and scale recognizable source visual elements horizontally through center and right, with a focal subject in the middle-right and the far-right CTA safe. Preserve the source campaign's signature visual objects, their proportions and visual relationship. Avoid vertical stacking, oversized background empty areas and abrupt image boundaries.",
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
 return `IMAGE EDIT / RESIZE: Transform the supplied master artwork to ${width}×${height} (${ratio.toFixed(2)}:1 target aspect). ${identity} ${direction} Prioritize visual identity and a professional format-specific layout over novel generation. The final image must be a seamless full-bleed scene with no hard seams, sharp crop boundaries or blank bars. No new typography, logos or CTA buttons: those are separate HTML overlays. ${layoutDirection({composition,overlayLayout})} ${generationWindow(target,family)}${custom?` Additional user instruction: ${custom}`:""}`;
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
 return `GENERATION CANVAS: ${imageAspectRatio(family,target)}. FINAL VISIBLE WINDOW: x=${pct(v.x)}, y=${pct(v.y)}, width=${pct(v.width)}, height=${pct(v.height)} of the generated image; only this centered window survives the final resize to ${target.width}×${target.height}. Keep ALL important source objects, complete heads/faces, hands, products and their identifying details inside that window with breathing room. Outside it use only expendable continuation of the same environment. Do not solve a horizontal layout by enlarging a portrait and cutting off the subject.`;
}
export function normalizedZones(layout){
 if(layout?.units!=="normalized"||!Array.isArray(layout.zones))return [];
 return layout.zones.slice(0,8).filter(z=>["logo","headline","subline","cta","overlay"].includes(z?.key)&&[z.x,z.y,z.width,z.height].every(Number.isFinite)&&z.width>0&&z.height>0).map(z=>{const x=Math.max(0,Math.min(1,z.x)),y=Math.max(0,Math.min(1,z.y));return {key:z.key,x,y,width:Math.min(z.width,1-x),height:Math.min(z.height,1-y)};}).filter(z=>z.width>0&&z.height>0);
}
export function layoutDirection({composition,overlayLayout}={}){
 const zones=normalizedZones(overlayLayout);
 const description=zones.length?zones.map(z=>`${z.key}: x=${pct(z.x)}, y=${pct(z.y)}, width=${pct(z.width)}, height=${pct(z.height)}`).join("; "):"No measured overlays supplied; preserve quiet upper-left copy area and CTA clearance.";
 return `HTML OVERLAY PLAN (${composition==="composition-1"?"Composition 1: logo and copy generally left, CTA right":"current measured layout"}): ${description} Coordinates are relative to the FINAL VISIBLE WINDOW, not the whole generation canvas. These are occupied foreground areas, including padding; do NOT draw them into the image. The measured positions take priority over generic family directions. Make those areas visually quiet, low-detail and suitable for light text. Recompose the WHOLE focal group, not just the character: keep faces, hands, products, coins/gems and other key identifying source details out from behind logo/headline/subline/CTA. Place the visual anchor in the remaining free area (typically right of left-aligned copy), scale it down if needed rather than hiding or cutting it. Preserve all original identities and the same environment. Before finishing, inspect the final window and ensure no key object is clipped or obstructed by the listed overlays.`;
}
