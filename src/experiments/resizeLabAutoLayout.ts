import type {MarketFormat} from "./resizeLabFormats";

// Immutable design tokens: all values are REAL pixels inside the exported format.
export type AutoLayout={safe:number;gap:number;logoSize:number;headlineSize:number;sublineSize:number;ctaSize:number;copy:{x:number;y:number;width:number;maxHeight:number};button:{x:number;y:number;width:number;height:number}|null;showSubline:boolean;};
const between=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function formatAutoLayout(format:Pick<MarketFormat,"width"|"height"|"family">):AutoLayout{
 const {width:w,height:h,family}=format;
 const micro=h<=60;
 const strip=!micro&&h<=120;
 const safe=micro?8:strip?between(Math.round(h*.15),12,18):between(Math.round(Math.min(w,h)*.08),16,32);
 const gap=micro?3:strip?5:between(Math.round(Math.min(w,h)*.035),7,14);
 const logoSize=micro?9:strip?between(Math.round(h*.14),10,13):between(Math.round(Math.min(w,h)*.045),12,20);
 const headlineSize=micro?10:strip?between(Math.round(h*.18),12,18):between(Math.round(Math.min(w,h)*.085),17,34);
 const sublineSize=strip?10:between(Math.round(Math.min(w,h)*.042),11,16);
 const ctaSize=micro?9:strip?11:between(Math.round(Math.min(w,h)*.045),11,15);
 if(micro){
   const buttonWidth=between(Math.round(w*.27),72,100);
   const buttonHeight=between(h-2*safe,24,30);
   const button={x:w-safe-buttonWidth,y:(h-buttonHeight)/2,width:buttonWidth,height:buttonHeight};
   return{safe,gap,logoSize,headlineSize,sublineSize,ctaSize,copy:{x:safe,y:safe,width:button.x-safe-gap-safe,maxHeight:h-2*safe},button,showSubline:false};
 }
 if(strip){
   const buttonWidth=w>=600?between(Math.round(w*.14),90,118):0;
   const buttonHeight=buttonWidth?between(Math.round(h*.42),26,36):0;
   const button=buttonWidth?{x:w-safe-buttonWidth,y:(h-buttonHeight)/2,width:buttonWidth,height:buttonHeight}:null;
   const copyWidth=button?Math.min(Math.round(w*.39),button.x-safe-gap-safe):w-2*safe;
   return{safe,gap,logoSize,headlineSize,sublineSize,ctaSize,copy:{x:safe,y:safe,width:copyWidth,maxHeight:h-2*safe},button,showSubline:false};
 }
 const square=family==="square";
 const buttonWidth=between(Math.round(w*(square?.34:.38)),76,180);
 const buttonHeight=between(Math.round(h*.12),30,46);
 const button={x:w-safe-buttonWidth,y:h-safe-buttonHeight,width:buttonWidth,height:buttonHeight};
 const copyWidth=square?Math.min(w-2*safe,Math.round(w*.58)):w-2*safe;
 return{safe,gap,logoSize,headlineSize,sublineSize,ctaSize,copy:{x:safe,y:safe,width:copyWidth,maxHeight:Math.max(20,button.y-safe-gap-safe)},button,showSubline:true};
}
export function fitCopy(layout:AutoLayout,logo:string,headline:string,subline:string,cta:string){
 const estimate=(text:string,size:number,weight=700)=>{const ctx=typeof document!=="undefined"?document.createElement("canvas").getContext("2d"):null;if(ctx){ctx.font=`${weight} ${size}px Arial`;return ctx.measureText(text).width;}return text.length*size*.6;};
 const lines=(text:string,size:number,width:number)=>{let count=0;for(const paragraph of text.split("\n")){let row="";for(const word of paragraph.split(/\s+/)){const next=row?row+" "+word:word;if(row&&estimate(next,size,800)>width){count++;row=word;}else row=next;}count+=Math.max(1,Math.ceil(estimate(row,size,800)/width));}return count;};
 const logoSize=(()=>{let size=layout.logoSize;while(size>6&&Math.max(...logo.split("\n").map(line=>estimate(line,size,900)))>layout.copy.width)size--;return size;})();
 const logoHeight=logo.split("\n").length*logoSize*1.12;
 const button=layout.button?{...layout.button,fontSize:Math.max(8,Math.min(layout.ctaSize,Math.floor((layout.button.width-10)/Math.max(1,cta.length*.57))))}:null;
 let headlineSize=layout.headlineSize,sublineSize=layout.sublineSize,showSubline=layout.showSubline;
 const total=()=>logoHeight+layout.gap+lines(headline,headlineSize,layout.copy.width)*headlineSize*1.12+(showSubline?layout.gap+lines(subline,sublineSize,layout.copy.width)*sublineSize*1.18:0);
 while(total()>layout.copy.maxHeight&&showSubline)showSubline=false;
 while(total()>layout.copy.maxHeight&&headlineSize>8)headlineSize--;
 const fits=total()<=layout.copy.maxHeight;
 return{logoSize,headlineSize,sublineSize,showSubline,button,fits};
}
