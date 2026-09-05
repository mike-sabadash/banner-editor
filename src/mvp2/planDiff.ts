import type {Placement,VisualFormat} from "./domain";

export type PlacementChange={before:Placement;after:Placement;fields:string[]};
export type MediaPlanDiff={
 added:Placement[];
 removed:Placement[];
 changed:PlacementChange[];
 unchanged:Placement[];
 requiredFormatsAdded:string[];
 requiredFormatsRemoved:string[];
};

const norm=(value:string|undefined)=>String(value||"").trim().toLowerCase();
const size=(p:Pick<Placement,"width"|"height">)=>`${p.width}×${p.height}`;

/**
 * Stable semantic identity for an ad placement. Row numbers and source files are
 * deliberately excluded so a re-import of the same plan does not create a new
 * placement just because the spreadsheet changed position.
 */
export function placementKey(p:Placement){
 return [norm(p.platform),norm(p.placement),p.width,p.height,norm(p.creativeType)].join("|");
}

function requirementSignature(p:Placement){
 const r=p.requirements||{};
 return JSON.stringify({
  maxZipKb:r.maxZipKb??null,
  maxDurationSec:r.maxDurationSec??null,
  clickTag:r.clickTag??null,
  tracking:r.tracking??null,
  impressionUrl:r.impressionUrl||"",
  clickUrl:r.clickUrl||"",
  sourceUrl:r.sourceUrl||"",
  sourceLabel:r.sourceLabel||"",
 });
}

function changedFields(before:Placement,after:Placement){
 const fields:string[]=[];
 if(norm(before.platform)!==norm(after.platform))fields.push("platform");
 if(norm(before.placement)!==norm(after.placement))fields.push("placement");
 if(before.width!==after.width||before.height!==after.height)fields.push("size");
 if(norm(before.creativeType)!==norm(after.creativeType))fields.push("creativeType");
 if(requirementSignature(before)!==requirementSignature(after))fields.push("requirements");
 return fields;
}

export function diffMediaPlan(previous:Placement[],next:Placement[]):MediaPlanDiff{
 const before=new Map(previous.map(p=>[placementKey(p),p]));
 const after=new Map(next.map(p=>[placementKey(p),p]));
 const added:Placement[]=[],removed:Placement[]=[],changed:PlacementChange[]=[],unchanged:Placement[]=[];
 for(const [key,p] of after){
  const old=before.get(key);
  if(!old){added.push(p);continue}
  const fields=changedFields(old,p);
  if(fields.length)changed.push({before:old,after:p,fields});else unchanged.push(p);
 }
 for(const [key,p] of before)if(!after.has(key))removed.push(p);
 const beforeSizes=new Set(previous.map(size)),afterSizes=new Set(next.map(size));
 return{
  added,removed,changed,unchanged,
  requiredFormatsAdded:[...afterSizes].filter(v=>!beforeSizes.has(v)).sort(),
  requiredFormatsRemoved:[...beforeSizes].filter(v=>!afterSizes.has(v)).sort(),
 };
}

/** Preserve existing visual creative for dimensions that remain required. */
export function preserveVisualsForPlan(nextFormats:VisualFormat[],existing:VisualFormat[]){
 const old=new Map(existing.map(f=>[`${f.width}×${f.height}`,f]));
 return nextFormats.map(format=>{
  const previous=old.get(`${format.width}×${format.height}`);
  return previous?{...format,id:previous.id,creativeState:previous.creativeState,creativeVersion:previous.creativeVersion,previewUrl:previous.previewUrl}:format;
 });
}
