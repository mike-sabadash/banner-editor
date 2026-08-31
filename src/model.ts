export type ElementKind = "eyebrow" | "headline" | "copy" | "button" | "legal" | "image";
export type BannerElement = { id:string; kind:ElementKind; name:string; text:string; assetUrl?:string; x:number; y:number; width:number; scale:number; rotation:number; opacity:number; fontFamily:string; fontSize:number; lineHeight:number; color:string; locked:boolean; visible:boolean };
export type Format = { id:string; label:string; width:number; height:number; status:"master"|"ready"|"review" };
export const formats: Format[] = [
  {id:"master",label:"Master",width:1200,height:628,status:"master"},
  {id:"medium",label:"Medium rectangle",width:300,height:250,status:"ready"},
  {id:"half",label:"Half page",width:300,height:600,status:"ready"},
  {id:"leader",label:"Leaderboard",width:728,height:90,status:"review"},
  {id:"mobile",label:"Mobile banner",width:320,height:50,status:"review"},
];
export const initialElements: BannerElement[] = [];
export const createTextElement=(kind:Exclude<ElementKind,"image">="headline"):BannerElement=>({id:`text-${crypto.randomUUID()}`,kind,name:kind==="headline"?"Headline":"Text",text:kind==="headline"?"Headline":"Text",x:10,y:10,width:45,scale:100,rotation:0,opacity:100,fontFamily:"Manrope",fontSize:kind==="headline"?48:18,lineHeight:110,color:"#1f211d",locked:false,visible:true});
export const platformProfiles=[
 {id:"google",name:"Google Ads HTML5",maxZip:150,maxDuration:30,click:"clickTag",maxFiles:null},
 {id:"yandex",name:"Yandex Direct HTML5",maxZip:512,maxDuration:30,click:"Yandex API",maxFiles:20},
];
export const fitPreview=(width:number,height:number,maxWidth=720,maxHeight=430)=>{const ratio=Math.min(maxWidth/width,maxHeight/height,1);return{width:Math.round(width*ratio),height:Math.round(height*ratio)}};
