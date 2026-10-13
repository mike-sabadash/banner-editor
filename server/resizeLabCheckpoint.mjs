const directions={
  micro:"Create an ultra-wide compact crop with one strong focal subject. Keep the subject right of center and leave a clean uninterrupted text zone on the left. Remove decorative clutter; the overlay will contain only logo and one short headline.",
  strip:"Recompose as a wide advertising strip. Place the key subject in the right third, preserve its face/product, and create clean negative space across the left half for a logo and headline. Keep the lower-right area calm for an optional CTA.",
  landscape:"Build a cinematic horizontal composition with the key subject right of center. Extend the environment naturally, keep the left 45 percent quiet for headline/subline, and keep the lower-right safe area readable for a CTA.",
  square:"Recompose around one dominant centered or right-biased subject. Preserve depth and campaign mood, with quiet space in the upper-left and lower-right for the overlay hierarchy.",
  portrait:"Create a vertical poster composition. Keep the subject in the central/lower visual field, preserve clean space in the upper-left for logo and copy, and leave the lower-right corner calm for CTA.",
  skyscraper:"Create a tall narrow composition with a strong vertical visual path. Keep the subject centered below the headline zone, avoid side detail that will be cropped, and preserve clear top and bottom overlay areas."
};

export function buildResizeLabPrompt({target,userPrompt="",family="landscape"}){
  const direction=directions[family]||directions.landscape;
  const custom=String(userPrompt).trim();
  return `Adapt the supplied advertising visual into ${target.width}×${target.height}. ${direction} Preserve the same subject, product identity, lighting, palette and campaign mood. Recompose the scene rather than stretching it. Keep important product and face details intact. Do NOT render words, logos, CTA buttons, letters or fake text into the image; all typography and UI are separate HTML layers.${custom?` Additional user art direction: ${custom}`:""}`;
}

export function imageAspectRatio(family){
  if(family==="micro"||family==="strip")return"21:9";
  if(family==="landscape")return"16:9";
  if(family==="square")return"1:1";
  if(family==="portrait")return"3:4";
  return"9:16";
}
