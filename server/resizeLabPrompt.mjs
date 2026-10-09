const directions={
  micro:"Create an ultra-wide compact crop with one strong focal subject. Keep the subject right of center and leave a clean uninterrupted text zone on the left. Remove decorative clutter; the overlay will contain only logo and one short headline.",
  strip:"Recompose as a wide advertising strip. Place the key subject in the right third, preserve its face/product, and create clean negative space across the left half for a logo and headline. Keep the lower-right area calm for an optional CTA.",
  landscape:"Build a cinematic horizontal composition with the key subject right of center. Extend the environment naturally, keep the left 45 percent quiet for headline/subline, and keep the lower-right safe area readable for a CTA.",
  square:"Recompose around one dominant centered or right-biased subject. Preserve depth and campaign mood, with quiet space in the upper-left and lower-right for the overlay hierarchy.",
  portrait:"Create a vertical poster composition. Keep the subject in the central/lower visual field, preserve clean space in the upper-left for logo and copy, and leave the lower-right corner calm for CTA.",
  skyscraper:"Create a tall narrow composition with a strong vertical visual path. Keep the subject centered below the headline zone, avoid side detail that will be cropped, and preserve clear top and bottom overlay areas."
};

const compositionGuides={
  "320x50":"Composition 1: reserve the left 60% for a small logo above a short headline; reserve the rightmost 104px for a vertically centered CTA. Keep all important visual subjects out of both zones. Focus the remaining imagery in the center-right gap; simplify aggressively.",
  "728x90":"Composition 1: reserve a 32px outer margin, a clean left 35% for logo/headline, and the far-right 18% for the CTA. Position the principal subject in the middle-right visual zone, clearly to the LEFT of the CTA, without covering face/product details. Keep the text and button zones low-detail.",
  "300x300":"Composition 1: place the principal subject slightly right of center, preferably in the middle-right open visual zone. Keep the upper-left 60% quiet for logo/headline/subline, using softer background or a subtle natural gradient; reserve the lower-right corner for the CTA. Do not hide the subject under the CTA."
};
const compositionGuide=(target,composition)=>composition==="composition-1"?(compositionGuides[`${target.width}x${target.height}`]||"Composition 1: reserve left/top negative space for logo and copy, and a separate right/bottom CTA zone. Place the key subject outside these zones. Preserve safe margins and avoid collisions."):"";

export function buildResizeLabPrompt({target,userPrompt="",family="landscape",composition="composition-1"}){
  const direction=directions[family]||directions.landscape;
  const custom=String(userPrompt).trim();
  return `Adapt the supplied advertising visual into ${target.width}×${target.height}. ${direction} ${compositionGuide(target,composition)} Identify the key subject (face, character or product) and reposition it into the largest available non-text/non-CTA area whenever possible; protect it from overlay occlusion. Preserve the same subject, product identity, lighting, palette and campaign mood. Recompose the scene rather than stretching it. Keep important product and face details intact. Do NOT render words, logos, CTA buttons, letters or fake text into the image; all typography and UI are separate HTML layers.${custom?` Additional user art direction: ${custom}`:""}`;
}

export function imageAspectRatio(family){
  if(family==="micro"||family==="strip")return"21:9";
  if(family==="landscape")return"16:9";
  if(family==="square")return"1:1";
  if(family==="portrait")return"3:4";
  return"9:16";
}
