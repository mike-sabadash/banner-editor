import {campaignCompliance,placementCompliance} from '../../server/mvp2Compliance.mjs';
export type AccessRole="owner"|"admin"|"designer"|"producer"|"viewer";
export type Readiness="ready"|"warning"|"blocked"|"unknown";
export type CreativeState="missing"|"draft"|"published";
export type ExportScale=1|2;
export type ExportType="html5"|"jpg"|"png"|"webp";
export type RequirementsSource="media-plan"|"manual";
export type ExportScaleSource="media-plan"|"manual";
export type FormatSpec={id:string;width:number;height:number;exportScale?:ExportScale;maxBytes?:number;exportType?:ExportType;source?:RequirementsSource;requirementsSource?:string;exportScaleSource?:ExportScaleSource};
export type FigmaAssetProvenance={fileKey:string;nodeId:string;versionId?:string;nodeName:string};
export type AssetSource={id:string;origin:"figma"|"upload"|"generated";sourceWidth?:number;sourceHeight?:number;mimeType?:string;storageUrl:string;vector:boolean;figma?:FigmaAssetProvenance};

export type RequirementSet={
 maxZipKb?:number|null;
 exportScale?:ExportScale|null;
 exportType?:ExportType|null;
 maxDurationSec?:number|null;
 clickTag?:boolean|null;
 tracking?:boolean|null;
 impressionUrl?:string;
 clickUrl?:string;
 sourceUrl?:string;
 sourceLabel?:string;
 checkedAt?:string; legal?:string; requiredElements?:string[];
};

export type Placement={id:string;platform:string;placement:string;width:number;height:number;requirements:RequirementSet;creativeType?:string;contentVariantIds?:string[];reviewIssues?:string[];language?:string;};

export type VisualFormat={
 exportScale?:ExportScale;maxBytes?:number;exportType?:ExportType;requirementsSource?:string;exportScaleSource?:ExportScaleSource;
 sourceType?:string;templateId?:string;familyId?:string;roleOverrides?:Record<string,Record<string,number|string>>;sourceFingerprint?:string;contentFingerprint?:string;variantRenders?:Record<string,any>;
 id:string;width:number;height:number;size:string;placementIds:string[];creativeState:CreativeState;creativeVersion:number;
 previewUrl?:string;previewHtml?:string;previewSvg?:string;previewType?:string;durationSec?:number;estimatedZipKb?:number;clickTagPresent?:boolean;publishedAt?:string;
};

export type CampaignFont={id:string;family:string;style:"Regular"|"Medium"|"Semibold"|"Bold";weight:number;fileName:string;dataUrl:string};
export type CreativeDocument={
 version:number;
 assets?:Record<string,AssetSource>;
 masterFormat:{width:number;height:number};
 scenes:Array<any>;
 fonts?:CampaignFont[];
 responsiveMasters?:Array<any>;
 formatOverrides?:Record<string,any>;
 rulerGuides?:Array<{id:string;axis:"x"|"y";position:number}>;
 updatedAt?:string;
};

export type Campaign={
 id:string;name:string;status:"draft"|"media-ready"|"creative"|"compliance"|"ready"|"delivered";placements:Placement[];formats:VisualFormat[];locale:"en"|"ru";
 contentVariants?:ContentVariant[];concepts?:Array<any>;families?:Array<any>;templateMotion?:number;creativeDocument?:CreativeDocument;
 creativeVersion?:number;mediaPlanVersion?:number;ttSnapshotVersion?:number;createdAt?:string;updatedAt?:string;
};

export type ContentVariant={id:string;name:string;language:string;headline:string;copy:string;cta:string;legal:string};

const sizeKey=(w:number,h:number)=>`${w}x${h}`;
export const formatId=(w:number,h:number)=>`fmt-${sizeKey(w,h)}`;

export const normalizedExportScale=(value:unknown):ExportScale=>Number(value)===2?2:1;
export const physicalExportSize=(format:Pick<VisualFormat,"width"|"height"|"exportScale">)=>{const scale=normalizedExportScale(format.exportScale);return {width:format.width*scale,height:format.height*scale,scale}};
export const formatRequirementBadges=(format:Pick<VisualFormat,"exportScale"|"maxBytes"|"exportType">)=>{const scale=normalizedExportScale(format.exportScale);return [`@${scale}x`,...(format.maxBytes?[`≤${Math.ceil(format.maxBytes/1000)}KB`]:[]),...(format.exportType?[format.exportType.toUpperCase()]:[])];};

export function compileVisualFormats(placements:Placement[],existing:VisualFormat[]=[]):VisualFormat[]{
 const existingByKey=new Map(existing.map(f=>[sizeKey(f.width,f.height),f]));const grouped=new Map<string,Placement[]>();
 for(const p of placements){const key=sizeKey(p.width,p.height);grouped.set(key,[...(grouped.get(key)||[]),p])}
 return [...grouped.entries()].map(([key,ps])=>{const first=ps[0],old=existingByKey.get(key),planScale=ps.some(p=>normalizedExportScale(p.requirements.exportScale)===2)?2:1,planMaxKb=ps.map(p=>Number(p.requirements.maxZipKb)||0).filter(Boolean),planType=ps.map(p=>p.requirements.exportType).find(Boolean),manualScale=old?.exportScaleSource==="manual";return {...old,id:old?.id||formatId(first.width,first.height),width:first.width,height:first.height,size:`${first.width}×${first.height}`,placementIds:ps.map(p=>p.id),creativeState:old?.creativeState||"missing",creativeVersion:old?.creativeVersion||0,exportScale:manualScale?normalizedExportScale(old?.exportScale):planScale,exportScaleSource:(manualScale?"manual":"media-plan") as ExportScaleSource,maxBytes:old?.maxBytes??(planMaxKb.length?Math.min(...planMaxKb)*1000:undefined),exportType:old?.exportType??planType??"html5",requirementsSource:old?.requirementsSource??first.requirements.sourceLabel,previewUrl:old?.previewUrl,previewHtml:old?.previewHtml,previewSvg:old?.previewSvg,previewType:old?.previewType,durationSec:old?.durationSec,estimatedZipKb:old?.estimatedZipKb,clickTagPresent:old?.clickTagPresent,publishedAt:old?.publishedAt};}).sort((a,b)=>b.width*b.height-a.width*a.height);
}

export function placementReadiness(p:Placement,format?:VisualFormat):Readiness{
 return placementCompliance({formats:format?[format]:[]},p).status;
}
export function campaignReadiness(c:Campaign){const s=campaignCompliance(c).summary;return {...s,unknown:s.warning};}
export function can(role:AccessRole,action:"edit-creative"|"edit-campaign"|"manage-access"|"deliver"){
 const matrix:Record<AccessRole,Set<string>>={owner:new Set(["edit-creative","edit-campaign","manage-access","deliver"]),admin:new Set(["edit-creative","edit-campaign","manage-access","deliver"]),designer:new Set(["edit-creative"]),producer:new Set(["edit-campaign","deliver"]),viewer:new Set()};return matrix[role].has(action);
}
