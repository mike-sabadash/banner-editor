export type AccessRole="owner"|"admin"|"designer"|"producer"|"viewer";
export type Readiness="ready"|"warning"|"blocked"|"unknown";
export type CreativeState="missing"|"draft"|"published";

export type RequirementSet={
 maxZipKb?:number|null;
 maxDurationSec?:number|null;
 clickTag?:boolean|null;
 tracking?:boolean|null;
 impressionUrl?:string;
 clickUrl?:string;
 sourceUrl?:string;
 sourceLabel?:string;
 checkedAt?:string;
};

export type Placement={id:string;platform:string;placement:string;width:number;height:number;requirements:RequirementSet;creativeType?:string;};

export type VisualFormat={
 id:string;width:number;height:number;size:string;placementIds:string[];creativeState:CreativeState;creativeVersion:number;
 previewUrl?:string;previewHtml?:string;previewSvg?:string;previewType?:string;durationSec?:number;estimatedZipKb?:number;clickTagPresent?:boolean;publishedAt?:string;
};

export type Campaign={
 id:string;name:string;status:"draft"|"media-ready"|"creative"|"compliance"|"ready"|"delivered";placements:Placement[];formats:VisualFormat[];locale:"en"|"ru";
 creativeVersion?:number;mediaPlanVersion?:number;ttSnapshotVersion?:number;createdAt?:string;updatedAt?:string;
};

const sizeKey=(w:number,h:number)=>`${w}x${h}`;
export const formatId=(w:number,h:number)=>`fmt-${sizeKey(w,h)}`;

export function compileVisualFormats(placements:Placement[],existing:VisualFormat[]=[]):VisualFormat[]{
 const existingByKey=new Map(existing.map(f=>[sizeKey(f.width,f.height),f]));const grouped=new Map<string,Placement[]>();
 for(const p of placements){const key=sizeKey(p.width,p.height);grouped.set(key,[...(grouped.get(key)||[]),p])}
 return [...grouped.entries()].map(([key,ps])=>{const first=ps[0],old=existingByKey.get(key);return {id:old?.id||formatId(first.width,first.height),width:first.width,height:first.height,size:`${first.width}×${first.height}`,placementIds:ps.map(p=>p.id),creativeState:old?.creativeState||"missing",creativeVersion:old?.creativeVersion||0,previewUrl:old?.previewUrl,previewHtml:old?.previewHtml,previewSvg:old?.previewSvg,previewType:old?.previewType,durationSec:old?.durationSec,estimatedZipKb:old?.estimatedZipKb,clickTagPresent:old?.clickTagPresent,publishedAt:old?.publishedAt};}).sort((a,b)=>b.width*b.height-a.width*a.height);
}

export function placementReadiness(p:Placement,format?:VisualFormat):Readiness{
 if(!format||format.creativeState==="missing")return"blocked";const r=p.requirements;const known=Boolean(r.maxZipKb||r.maxDurationSec||r.clickTag!==undefined&&r.clickTag!==null||r.tracking!==undefined&&r.tracking!==null||r.sourceUrl||r.sourceLabel);return known?"ready":"unknown";
}
export function campaignReadiness(c:Campaign){let ready=0,warning=0,blocked=0,unknown=0;for(const p of c.placements){const f=c.formats.find(x=>x.placementIds.includes(p.id));const s=placementReadiness(p,f);if(s==="ready")ready++;else if(s==="warning")warning++;else if(s==="blocked")blocked++;else unknown++}return{ready,warning,blocked,unknown,total:c.placements.length};}
export function can(role:AccessRole,action:"edit-creative"|"edit-campaign"|"manage-access"|"deliver"){
 const matrix:Record<AccessRole,Set<string>>={owner:new Set(["edit-creative","edit-campaign","manage-access","deliver"]),admin:new Set(["edit-creative","edit-campaign","manage-access","deliver"]),designer:new Set(["edit-creative"]),producer:new Set(["edit-campaign","deliver"]),viewer:new Set()};return matrix[role].has(action);
}
