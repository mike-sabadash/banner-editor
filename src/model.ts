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
export const initialElements: BannerElement[] = [
  {id:"eyebrow",kind:"eyebrow",name:"Eyebrow",text:"NEW COLLECTION",x:8,y:13,width:45,scale:100,rotation:0,opacity:100,fontFamily:"DM Sans",fontSize:12,lineHeight:100,color:"#d8ca91",locked:false,visible:true},
  {id:"headline",kind:"headline",name:"Headline",text:"Move beyond ordinary.",x:8,y:24,width:54,scale:100,rotation:0,opacity:100,fontFamily:"Manrope",fontSize:52,lineHeight:95,color:"#ffffff",locked:false,visible:true},
  {id:"copy",kind:"copy",name:"Body copy",text:"Built for the moments that matter.",x:8,y:56,width:44,scale:100,rotation:0,opacity:100,fontFamily:"DM Sans",fontSize:15,lineHeight:130,color:"#d1d5cc",locked:false,visible:true},
  {id:"button",kind:"button",name:"CTA",text:"Explore now",x:8,y:71,width:20,scale:100,rotation:0,opacity:100,fontFamily:"DM Sans",fontSize:12,lineHeight:100,color:"#20231e",locked:true,visible:true},
  {id:"legal",kind:"legal",name:"Legal copy",text:"Terms and conditions apply.",x:8,y:92,width:42,scale:100,rotation:0,opacity:100,fontFamily:"DM Sans",fontSize:8,lineHeight:120,color:"#a8ada5",locked:true,visible:true},
];
export const platformProfiles=[
 {id:"google",name:"Google Ads HTML5",maxZip:150,maxDuration:30,click:"clickTag",maxFiles:null},
 {id:"yandex",name:"Yandex Direct HTML5",maxZip:512,maxDuration:30,click:"Yandex API",maxFiles:20},
];
export const fitPreview=(width:number,height:number,maxWidth=720,maxHeight=430)=>{const ratio=Math.min(maxWidth/width,maxHeight/height,1);return{width:Math.round(width*ratio),height:Math.round(height*ratio)}};
