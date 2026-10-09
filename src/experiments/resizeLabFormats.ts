import type { ResizeLabLayout } from "./resizeLabCompositions";

export type ResizeFamily = "micro" | "strip" | "landscape" | "square" | "portrait" | "skyscraper";

export type MarketFormat = {
  id: string;
  width: number;
  height: number;
  family: ResizeFamily;
  label: string;
  platforms: string[];
  core?: boolean;
};

const yandex = "Yandex Direct · AdFox · AdRiver";

export const marketFormats: MarketFormat[] = [
  {id:"320x50",width:320,height:50,family:"micro",label:"Mobile banner",platforms:[yandex],core:true},
  {id:"468x60",width:468,height:60,family:"micro",label:"Legacy full banner",platforms:["AdFox · AdRiver"]},
  {id:"728x90",width:728,height:90,family:"strip",label:"Leaderboard",platforms:[yandex],core:true},
  {id:"970x90",width:970,height:90,family:"strip",label:"Large leaderboard",platforms:["AdFox · AdRiver"]},
  {id:"320x100",width:320,height:100,family:"strip",label:"Large mobile banner",platforms:[yandex],core:true},
  {id:"1000x120",width:1000,height:120,family:"strip",label:"Top line",platforms:[yandex]},
  {id:"970x250",width:970,height:250,family:"landscape",label:"Billboard",platforms:[yandex],core:true},
  {id:"480x320",width:480,height:320,family:"landscape",label:"Mobile landscape",platforms:[yandex]},
  {id:"1200x628",width:1200,height:628,family:"landscape",label:"Social landscape",platforms:["VK Ads · Avito"] ,core:true},
  {id:"300x250",width:300,height:250,family:"square",label:"Medium rectangle",platforms:[yandex],core:true},
  {id:"336x280",width:336,height:280,family:"square",label:"Large rectangle",platforms:[yandex]},
  {id:"300x300",width:300,height:300,family:"square",label:"Square",platforms:[yandex]},
  {id:"1080x1080",width:1080,height:1080,family:"square",label:"Social square",platforms:["VK Ads · Avito"],core:true},
  {id:"240x400",width:240,height:400,family:"portrait",label:"Vertical rectangle",platforms:[yandex],core:true},
  {id:"300x500",width:300,height:500,family:"portrait",label:"Portrait",platforms:[yandex]},
  {id:"320x480",width:320,height:480,family:"portrait",label:"Mobile interstitial",platforms:[yandex],core:true},
  {id:"1080x1920",width:1080,height:1920,family:"portrait",label:"Story / vertical",platforms:["VK Ads · Avito"]},
  {id:"160x600",width:160,height:600,family:"skyscraper",label:"Wide skyscraper",platforms:[yandex]},
  {id:"240x600",width:240,height:600,family:"skyscraper",label:"Skyscraper",platforms:[yandex]},
  {id:"300x600",width:300,height:600,family:"skyscraper",label:"Half page",platforms:[yandex],core:true},
];

const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));
const pct = (pixels:number,total:number) => Number((pixels/total*100).toFixed(2));

export type FormatPolicy = {
  layout: ResizeLabLayout;
  safeX: number;
  safeY: number;
  hidden: Array<"subline"|"cta">;
  note: string;
};

export function formatPolicy(format: Pick<MarketFormat,"width"|"height"|"family">): FormatPolicy {
  const {width,height,family}=format;
  const safeX=family==="micro"?clamp(Math.round(width*.04),12,20):clamp(Math.round(width*.08),20,32);
  const safeY=family==="micro"?8:family==="strip"?clamp(Math.round(height*.16),12,24):clamp(Math.round(height*.08),20,32);
  const x=pct(safeX,width), y=pct(safeY,height), right=100-x;
  const baseFont=clamp(Math.round(Math.min(width,height)*.09),12,34);
  const hidden:Array<"subline"|"cta">=[];
  let layout:ResizeLabLayout;
  let note="Full hierarchy";

  if(family==="micro"){
    hidden.push("subline","cta");note="Compact hierarchy: logo + headline";
    layout={logo:{x,y,w:18},headline:{x:24,y:30,w:72,fontSize:clamp(Math.round(height*.3),12,17)},subline:{x,y:0,w:0,fontSize:0,visible:false},cta:{x,y:0,w:0,fontSize:0,visible:false}};
  }else if(family==="strip"){
    const showSubline=width>=600&&height>=90,showCta=width>=600&&height>=80;
    if(!showSubline)hidden.push("subline");if(!showCta)hidden.push("cta");
    note=showSubline&&showCta?"Single-row hierarchy":"Reduced strip hierarchy";
    layout={logo:{x,y,w:14},headline:{x,y:47,w:showSubline?40:showCta?55:72,fontSize:clamp(Math.round(height*.28),16,28)},subline:{x:47,y:54,w:20,fontSize:clamp(Math.round(height*.14),11,14),visible:showSubline},cta:{x:showCta?75:right-22,y:36,w:showCta?right-75:0,fontSize:13,visible:showCta}};
  }else if(family==="landscape"){
    layout={logo:{x,y,w:16},headline:{x,y:30,w:43,fontSize:clamp(baseFont,22,34)},subline:{x,y:57,w:38,fontSize:clamp(Math.round(baseFont*.5),12,17),visible:true},cta:{x:72,y:68,w:right-72,fontSize:clamp(Math.round(baseFont*.48),12,16),visible:true}};
  }else if(family==="square"){
    layout={logo:{x,y,w:28},headline:{x,y:25,w:76,fontSize:clamp(baseFont,22,32)},subline:{x,y:50,w:68,fontSize:clamp(Math.round(baseFont*.5),12,16),visible:true},cta:{x:56,y:76,w:right-56,fontSize:clamp(Math.round(baseFont*.48),12,16),visible:true}};
  }else if(family==="portrait"){
    layout={logo:{x,y,w:30},headline:{x,y:20,w:76,fontSize:clamp(baseFont,24,34)},subline:{x,y:42,w:70,fontSize:clamp(Math.round(baseFont*.5),12,16),visible:true},cta:{x:55,y:83,w:right-55,fontSize:clamp(Math.round(baseFont*.46),12,15),visible:true}};
  }else{
    const narrow=width<200;if(narrow)hidden.push("subline");note=narrow?"Narrow hierarchy: subline removed":"Vertical hierarchy";
    layout={logo:{x,y,w:narrow?55:42},headline:{x,y:18,w:right-x,fontSize:clamp(baseFont,18,28)},subline:{x,y:42,w:right-x,fontSize:12,visible:!narrow},cta:{x,y:84,w:right-x,fontSize:12,visible:true}};
  }
  return{layout,safeX,safeY,hidden,note};
}

export const defaultFormatIds = marketFormats.filter(item=>item.core).map(item=>item.id);
