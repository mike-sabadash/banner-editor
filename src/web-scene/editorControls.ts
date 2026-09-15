import type {Campaign} from "../mvp2/domain";
import {formatsFromCampaign} from "./campaignBridge";
import {RU_CORE_10,type OutputFormat} from "./sceneModel";

export const FONT_FAMILIES=["Inter","Manrope","Roboto","Montserrat","Golos Text","PT Sans","PT Serif","Rubik","Oswald","Unbounded"] as const;
export const FONT_STYLES=[
  {label:"Regular",weight:400},
  {label:"Medium",weight:500},
  {label:"Semibold",weight:600},
  {label:"Bold",weight:700},
] as const;

export type CampaignBorder={enabled:boolean;color:string};
export const DEFAULT_CAMPAIGN_BORDER:CampaignBorder={enabled:false,color:"#000000"};

export function mergedDisplayFormats(campaign?:Campaign){
  const map=new Map<string,OutputFormat>();
  for(const format of RU_CORE_10)map.set(`${format.width}x${format.height}`,format);
  for(const format of formatsFromCampaign(campaign))map.set(`${format.width}x${format.height}`,format);
  return [...map.values()];
}

export function fontStyleLabel(weight?:number){
  const value=weight??400;
  return FONT_STYLES.reduce((best,item)=>Math.abs(item.weight-value)<Math.abs(best.weight-value)?item:best,FONT_STYLES[0]).label;
}
