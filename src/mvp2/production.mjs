/** Shared canonical content/template production. No network or AI guesses. */
export const TEMPLATE_ID = 'type-retail-v1';
export const ROLE_IDS = ['background.primary', 'headline.primary', 'copy.secondary', 'cta.primary', 'legal.primary'];
export const familyFor = (w,h) => w/h >= 5 ? 'strip' : w/h >= 2 ? 'landscape' : w/h < .8 ? 'portrait' : 'square';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sourceFingerprint(campaign, format) {
 return JSON.stringify([TEMPLATE_ID, campaign.contentVariants || [], format.width, format.height, format.roleOverrides || {}, campaign.templateMotion ?? .8]);
}
function textLines(text, width, fontSize) {
 const capacity = Math.max(1, Math.floor(width / (fontSize * .62)));
 return String(text || '').split('\n').reduce((sum,line) => sum + Math.max(1,Math.ceil([...line].length/capacity)),0);
}
export function renderTemplate(format, content, duration=.8) {
 const w=Number(format.width),h=Number(format.height),family=familyFor(w,h),pad=family==='strip'?5:12;
 const issues=[];const roles=[];const inner=w-2*pad;
 const headlineSize=family==='strip'?16:family==='landscape'?22:Math.min(32,Math.floor(w/9));
 const headlineBox=family==='strip'?{x:pad,y:pad,width:Math.floor(inner*.62),height:h-2*pad}:family==='landscape'?{x:pad,y:pad,width:Math.floor(inner*.64),height:Math.floor((h-2*pad)*.6)}:{x:pad,y:Math.round(h*.12),width:inner,height:Math.round(h*.34)};
 const add=(id,text,box,size,color='#ffffff')=>{
  if(!text)return;
  const overrides=format.roleOverrides?.[id] || {};
  const fontSize=overrides.fontSize??size;
  const role={id,text:String(text),...box,fontSize,color:overrides.color??color};
  if(!Number.isFinite(fontSize)||fontSize<12||fontSize>100)issues.push({rule:'text-size',role:id,detail:'Text must be between 12 and 100 px.'});
  const needed=textLines(text,box.width,fontSize)*fontSize*1.2;
  if(needed>box.height)issues.push({rule:'text-overflow',role:id,detail:`Copy needs about ${Math.ceil(needed)} px; available ${box.height} px. Shorten copy or adjust this format.`});
  if(!/^#[0-9a-f]{6}$/i.test(role.color))issues.push({rule:'color',role:id,detail:'Use a six-digit hex color.'});
  roles.push(role);
 };
 if(!content?.headline?.trim())issues.push({rule:'missing-content',role:'headline.primary',detail:'Add a headline.'});
 if(!content?.cta?.trim())issues.push({rule:'missing-content',role:'cta.primary',detail:'Add a CTA.'});
 add('headline.primary',content?.headline,headlineBox,headlineSize);
 if(family==='strip'){
  add('cta.primary',content?.cta,{x:Math.ceil(inner*.68)+pad,y:pad,width:Math.floor(inner*.32),height:h-2*pad},12,'#f5d36b');
  if(content?.legal?.trim()||content?.copy?.trim())issues.push({rule:'compact-copy',role:'legal.primary',detail:'This strip composition has no secondary/legal slot. Use approved compact content or a Figma source.'});
 } else if(family==='landscape'){
  add('copy.secondary',content?.copy,{x:pad,y:Math.round(h*.55),width:Math.floor(inner*.64),height:Math.max(15,h*.2)},12);
  add('cta.primary',content?.cta,{x:Math.round(w*.7),y:pad,width:Math.floor(w*.3)-pad,height:Math.floor(h*.5)},14,'#f5d36b');
  add('legal.primary',content?.legal,{x:pad,y:h-pad-15,width:inner,height:15},12,'#dddddd');
 } else {
  add('copy.secondary',content?.copy,{x:pad,y:Math.round(h*.49),width:inner,height:Math.round(h*.19)},14);
  add('cta.primary',content?.cta,{x:pad,y:Math.round(h*.74),width:inner,height:Math.round(h*.1)},16,'#f5d36b');
  add('legal.primary',content?.legal,{x:pad,y:h-pad-Math.max(30,Math.floor(h*.1)),width:inner,height:Math.max(30,Math.floor(h*.1))},12,'#dddddd');
 }
 for(const r of roles)if(r.x<pad||r.y<pad||r.x+r.width>w-pad+.5||r.y+r.height>h-pad+.5)issues.push({rule:'bounds',role:r.id,detail:'Role exceeds the safe area.'});
 const html=`<!doctype html><html lang="${escape(content?.language||'en')}"><head><meta charset="utf-8"><meta name="ad.size" content="width=${w},height=${h}"><style>*{box-sizing:border-box}html,body{margin:0;width:${w}px;height:${h}px;background:#17212c;overflow:hidden} [data-role]{position:absolute;white-space:pre-wrap;overflow-wrap:anywhere;font-family:monospace;line-height:1.2;margin:0;font-weight:400} @keyframes enter{from{opacity:0}to{opacity:1}}</style></head><body>${roles.map(r=>`<div data-role="${r.id}" style="left:${r.x}px;top:${r.y}px;width:${r.width}px;height:${r.height}px;font-size:${r.fontSize}px;color:${escape(r.color)};animation:enter ${Number(duration)}s both">${escape(r.text)}</div>`).join('')}</body></html>`;
 return {estimatedZipKb:(new TextEncoder().encode(html).length+8192)/1024,previewHtml:html,previewType:'html',durationSec:Number(duration),presentElements:roles.map(r=>r.id),safeZonePassed:!issues.some(i=>i.rule==='bounds'),productionIssues:issues,roles,familyId:family};
}
export function publishTemplate(campaign) {
 if(!campaign.placements?.length||!campaign.contentVariants?.length)throw Object.assign(new Error('Add placements and content before publishing.'),{status:400});
 const formats=campaign.formats.map(format=>{
  if(format.creativeState==='published'&&format.sourceType!=='template')throw Object.assign(new Error('Existing Figma creative is preserved. Use a new campaign for this template.'),{status:409});
  const variantRenders=Object.fromEntries(campaign.contentVariants.map(content=>[content.id,renderTemplate(format,content,campaign.templateMotion??.8)]));
  const preview=variantRenders[campaign.contentVariants[0].id];
  return {...format,...preview,sourceType:'template',templateId:TEMPLATE_ID,variantRenders,sourceFingerprint:sourceFingerprint(campaign,format),creativeState:'published',creativeVersion:Number(format.creativeVersion||0)+1,publishedAt:new Date().toISOString()};
 });
 return {formats,creativeVersion:Number(campaign.creativeVersion||0)+1,status:'compliance',concepts:[{id:'concept-primary',name:'Primary concept'}],families:[...new Set(formats.map(f=>f.familyId))].map(id=>({id,conceptId:'concept-primary',name:id,sourceType:'template',templateId:TEMPLATE_ID}))};
}
/** Ephemeral deliverable projection: do not create a Figma frame per copy variant. */
export function productionCampaign(campaign) {
 if(!campaign.contentVariants?.length)return campaign;
 const formats=[],placements=[];
 for(const p of campaign.placements||[]){
  const base=(campaign.formats||[]).find(f=>f.placementIds?.includes(p.id));
  const ids=p.contentVariantIds?.length?p.contentVariantIds:['__unassigned__'];
  for(const variantId of ids){
   const content=campaign.contentVariants.find(c=>c.id===variantId),id=`${p.id}::${variantId}`;
   placements.push({...p,id,sourcePlacementId:p.id,contentVariantId:variantId,placement:`${p.placement} · ${content?.name||'Unassigned content'}`});
   if(!base)continue;
   const rendered=base.variantRenders?.[variantId];
   const issues=[...(rendered?.productionIssues||[])];
   if(p.requirements?.legal&&content?.legal!==p.requirements.legal)issues.push({rule:'legal-content',detail:'Content legal text differs from the placement requirement.'});
   if(!content)issues.push({rule:'missing-content',detail:'Assign an existing content variant.'});
   if(base.sourceType!=='template')issues.push({rule:'content-binding',detail:'Figma content variant publishing is not yet available. No variant substitution has been applied.'});
   if(!rendered)issues.push({rule:'unpublished-content',detail:'Publish this content variant.'});
   formats.push({...base,...rendered,id:`${base.id}::${variantId}`,placementIds:[id],productionIssues:issues,outdated:base.sourceType==='template'&&base.sourceFingerprint!==sourceFingerprint(campaign,base)});
  }
 }
 return {...campaign,placements,formats};
}
