import type {CampaignFont} from "../mvp2/domain";

export const CAMPAIGN_FONT_ACCEPT=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf,application/font-woff,application/x-font-ttf,application/x-font-opentype";
export const CAMPAIGN_FONT_MAX_BYTES=4*1024*1024;

export function campaignFontStyleFromName(name:string){
 const n=name.toLowerCase();
 if(/semi[-_ ]?bold|demi[-_ ]?bold/.test(n))return {style:"Semibold" as const,weight:600};
 if(/medium/.test(n))return {style:"Medium" as const,weight:500};
 if(/bold/.test(n))return {style:"Bold" as const,weight:700};
 return {style:"Regular" as const,weight:400};
}
export function campaignFontFamilyFromName(name:string){
 return name.replace(/\.(woff2?|ttf|otf)$/i,"").replace(/[-_ ]?(regular|medium|semi[-_ ]?bold|demi[-_ ]?bold|bold)$/i,"").replace(/[_-]+/g," ").trim()||"Campaign Font";
}
export function fontFamilies(fonts:CampaignFont[]=[]){return [...new Set(fonts.map(f=>f.family).filter(Boolean))]}
export async function registerCampaignFonts(fonts:CampaignFont[]=[]){
 if(typeof FontFace==="undefined"||typeof document==="undefined")return;
 await Promise.all(fonts.map(async f=>{try{const face=new FontFace(f.family,`url(${f.dataUrl})`,{weight:String(f.weight),style:"normal"});await face.load();document.fonts.add(face)}catch(e){console.warn("Campaign font failed to load",f.fileName,e)}}));
}
export function fileToCampaignFont(file:File):Promise<CampaignFont>{
 if(file.size>CAMPAIGN_FONT_MAX_BYTES)return Promise.reject(new Error("Font file is larger than 4 MB"));
 const meta=campaignFontStyleFromName(file.name),family=campaignFontFamilyFromName(file.name);
 return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error("Could not read font file"));reader.onload=()=>resolve({id:`font-${crypto.randomUUID()}`,family,style:meta.style,weight:meta.weight,fileName:file.name,dataUrl:String(reader.result)});reader.readAsDataURL(file)});
}
