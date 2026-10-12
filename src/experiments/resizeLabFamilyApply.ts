import type {MarketFormat} from './resizeLabFormats';
import type {VisualTransform} from './resizeLabEditing';
export const familyPositionKeys=['logo','headline','subline','cta'] as const;
export type FamilyPositionKey=typeof familyPositionKeys[number];
export type FamilyApplyOptions={image:boolean;visual:boolean;logo:boolean;positions:FamilyPositionKey[];preserveOverrides:boolean};
export const defaultFamilyApply:FamilyApplyOptions={image:false,visual:true,logo:false,positions:[...familyPositionKeys],preserveOverrides:true};
export type FamilyEditable={image?:string;visual?:VisualTransform;logoWidth?:number;overrides?:Partial<Record<FamilyPositionKey,{x:number;y:number}>>;adapted?:boolean;error?:string;candidate?:{image:string;canApply:boolean};planId?:string;warning?:string};
// Per-format coordinates remain relative to each banner's own layout.
// Only chosen properties are copied; AI adaptations remain separate by default.
export function familyApplyPatch(source:FamilyEditable,from:MarketFormat,target:FamilyEditable,to:MarketFormat,options:FamilyApplyOptions,explicit:FamilyEditable=target):FamilyEditable{
 const patch:FamilyEditable={};
 if(options.image&&source.image){patch.image=source.image;patch.adapted=true;patch.error=undefined;patch.candidate=undefined;patch.planId=undefined;patch.warning=undefined;}
 if(options.visual&&source.visual&&(!options.preserveOverrides||!explicit.visual))patch.visual={...source.visual};
 if(options.logo&&source.logoWidth!=null&&(!options.preserveOverrides||explicit.logoWidth==null))patch.logoWidth=source.logoWidth/from.width*to.width;
 const offsets={...target.overrides};let changed=false;
 for(const key of options.positions)if(!options.preserveOverrides||!explicit.overrides?.[key]){const p=source.overrides?.[key]||{x:0,y:0};offsets[key]={x:p.x/from.width*to.width,y:p.y/from.height*to.height};changed=true;}
 if(changed)patch.overrides=offsets;
 return patch;
}
