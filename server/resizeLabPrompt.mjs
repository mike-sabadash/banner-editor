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
export function buildResizeLabPrompt({target,userPrompt="",family="landscape"}){
 const width=Number(target.width)||728,height=Number(target.height)||90;
 const ratio=width/height;
 const direction=ratio>=3?directions.strip:directions[family]||directions.landscape;
 const custom=String(userPrompt).trim();
 return `IMAGE EDIT / RESIZE: Transform the supplied master artwork to ${width}×${height} (${ratio.toFixed(2)}:1 target aspect). ${identity} ${direction} Prioritize visual identity and a professional format-specific layout over novel generation. The final image must be a seamless full-bleed scene with no hard seams, sharp crop boundaries or blank bars. No new typography, logos or CTA buttons: those are separate HTML overlays.${custom?` Additional user instruction: ${custom}`:""}`;
}
export function imageAspectRatio(family){
 if(family==="micro"||family==="strip")return"21:9";
 if(family==="landscape")return"16:9";
 if(family==="square")return"1:1";
 if(family==="portrait")return"3:4";
 return"9:16";
}
