// Append only measured placement constraints; keep the approved base prompt intact.
export function checkpointOverlayInstruction(input){
 const {family,target,overlayLayout}=input;
 if(!['micro','strip'].includes(family)||overlayLayout?.units!=='normalized')return '';
 const zones=(overlayLayout.zones||[]).filter(z=>['logo','headline','subline','cta'].includes(z.key)&&[z.x,z.y,z.width,z.height].every(Number.isFinite)&&z.width>0&&z.height>0&&z.x>=0&&z.y>=0&&z.x+z.width<=1.001&&z.y+z.height<=1.001);
 const cta=zones.find(z=>z.key==='cta');
 if(!cta)return '';
 const visibleHeight=Math.min(1,(21/9)/(target.width/target.height)),top=(1-visibleHeight)/2;
 const pct=n=>Math.round(n*1000)/10;
 const box=z=>`x ${pct(z.x)}–${pct(z.x+z.width)}%, y ${pct(top+z.y*visibleHeight)}–${pct(top+(z.y+z.height)*visibleHeight)}%`;
 const placement=` Final banner coordinates mapped onto the generated 21:9 image: the HTML CTA covers ${box(cta)}. Keep the focal subject's face/product and important details entirely outside this rectangle, to its left with a small clear gap; leave only background behind the CTA. Do not draw the CTA.`;
 if(family!=='micro')return placement;
 const copy=zones.filter(z=>['logo','headline','subline'].includes(z.key)).map(z=>`${z.key}: ${box(z)}`).join('; ');
 return placement+` For this micro banner, recompose rather than merely crop or strip the scene down: retain the source's recognizable setting, lighting and campaign atmosphere around the subject. Only the central horizontal band y ${pct(top)}–${pct(top+visibleHeight)}% of the generated image will be visible. Fit the face/product and its important details inside this band at a smaller scale. Keep the measured HTML copy areas quiet (${copy||'left side'}); do not render text. Preserve any additional user art direction above.`;
}
