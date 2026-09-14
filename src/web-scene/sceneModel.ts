export type LayerRole = "background" | "hero" | "logo" | "headline" | "copy" | "cta" | "legal" | "graphic";
export type LayerKind = "text" | "image" | "shape";
export type MotionPreset = "none" | "fade" | "from-left" | "from-right" | "from-top" | "from-bottom" | "scale-in";
export type LayoutFamily = "portrait" | "tall" | "rectangle" | "wide" | "strip" | "micro-strip";
export type Box = {x:number;y:number;w:number;h:number};

export type SceneLayer = {
  id:string;
  name:string;
  kind:LayerKind;
  role:LayerRole;
  text?:string;
  color?:string;
  assetUrl?:string;
  fit?:"cover"|"contain";
  masterBox:Box;
  fontSize?:number;
  fontWeight?:number;
  fontFamily?:string;
  motion:MotionPreset;
  motionDurationMs:number;
  easing:"ease-out"|"ease-in-out"|"linear";
  startMs:number;
  endMs:number;
  visible:boolean;
};

export type Scene={id:string;name:string;durationMs:number;layers:SceneLayer[]};
export type OutputFormat={id:string;width:number;height:number;label:string;family:LayoutFamily};
export type GeneratedLayer=SceneLayer&{box:Box;fontSize?:number;motionVector:{x:number;y:number}};
export type GeneratedScene={sceneId:string;formatId:string;family:LayoutFamily;layers:GeneratedLayer[]};

export const MASTER_FORMAT:OutputFormat={id:"master",width:300,height:600,label:"Master 300×600",family:"tall"};

export const RU_CORE_10:OutputFormat[]=[
  ["240x400",240,400],["300x250",300,250],["300x300",300,300],["300x500",300,500],["300x600",300,600],
  ["160x600",160,600],["728x90",728,90],["970x250",970,250],["320x50",320,50],["320x100",320,100]
].map(([id,width,height])=>({id:String(id),width:Number(width),height:Number(height),label:String(id),family:familyFor(Number(width),Number(height))}));

export function familyFor(width:number,height:number):LayoutFamily{
  const ratio=width/height;
  if(height<=60)return "micro-strip";
  if(height<=120)return "strip";
  if(ratio>=2.3)return "wide";
  if(height/width>=1.7)return "tall";
  if(height>width)return "portrait";
  return "rectangle";
}

const B=(x:number,y:number,w:number,h:number):Box=>({x,y,w,h});
const base=(id:string,name:string,kind:LayerKind,role:LayerRole,masterBox:Box,extra:Partial<SceneLayer>={}):SceneLayer=>({
  id,name,kind,role,masterBox,motion:"none",motionDurationMs:400,easing:"ease-out",startMs:0,endMs:2200,visible:true,...extra
});

export const DEFAULT_SCENES:Scene[]=[
  {id:"scene-1",name:"Product",durationMs:2200,layers:[
    base("bg-1","Background","shape","background",B(0,0,100,100),{color:"#111827",endMs:2200}),
    base("hero-1","Product image","shape","hero",B(12,42,76,38),{color:"#6757ff",motion:"from-right",motionDurationMs:520,startMs:120,endMs:2200}),
    base("headline-1","Headline","text","headline",B(9,13,82,15),{text:"Летний запуск",color:"#ffffff",fontSize:34,fontWeight:760,fontFamily:"Inter",motion:"from-left",motionDurationMs:420,startMs:80,endMs:2200}),
    base("copy-1","Copy","text","copy",B(9,30,72,9),{text:"Новый продукт уже здесь",color:"#cbd5e1",fontSize:16,fontWeight:450,fontFamily:"Inter",motion:"fade",motionDurationMs:320,startMs:260,endMs:2200})
  ]},
  {id:"scene-2",name:"Offer",durationMs:2200,layers:[
    base("bg-2","Background","shape","background",B(0,0,100,100),{color:"#24104f",endMs:2200}),
    base("graphic-2","Graphic","shape","graphic",B(17,40,66,36),{color:"#f4b740",motion:"scale-in",motionDurationMs:460,startMs:120,endMs:2200}),
    base("headline-2","Headline","text","headline",B(9,14,82,18),{text:"−30% до воскресенья",color:"#ffffff",fontSize:32,fontWeight:760,fontFamily:"Inter",motion:"from-bottom",motionDurationMs:420,startMs:120,endMs:2200}),
    base("cta-2","CTA","text","cta",B(9,82,42,8),{text:"Подробнее",color:"#111318",fontSize:14,fontWeight:700,fontFamily:"Inter",motion:"fade",motionDurationMs:300,startMs:520,endMs:2200})
  ]},
  {id:"scene-3",name:"Legal",durationMs:1600,layers:[
    base("bg-3","End card","shape","background",B(0,0,100,100),{color:"#12151b",endMs:1600}),
    base("logo-3","Logo","text","logo",B(10,30,42,12),{text:"BRAND",color:"#ffffff",fontSize:28,fontWeight:800,fontFamily:"Inter",motion:"scale-in",motionDurationMs:330,startMs:80,endMs:1600}),
    base("legal-3","Legal","text","legal",B(10,72,80,12),{text:"Реклама. Подробности на сайте.",color:"#b7bfcc",fontSize:11,fontWeight:450,fontFamily:"Inter",motion:"fade",motionDurationMs:300,startMs:260,endMs:1600})
  ]}
];

export function templateFor(family:LayoutFamily,role:LayerRole):Box{
  const t:Record<LayoutFamily,Partial<Record<LayerRole,Box>>>={
    rectangle:{background:B(0,0,100,100),logo:B(6,6,22,10),headline:B(6,12,42,24),copy:B(6,40,38,18),hero:B(52,4,44,72),graphic:B(54,10,40,64),cta:B(6,76,30,14),legal:B(6,84,88,10)},
    portrait:{background:B(0,0,100,100),logo:B(7,5,28,9),headline:B(7,14,86,18),copy:B(7,34,80,12),hero:B(6,48,88,34),graphic:B(14,44,72,34),cta:B(7,84,42,10),legal:B(7,84,86,10)},
    tall:{background:B(0,0,100,100),logo:B(8,4,32,7),headline:B(8,12,84,16),copy:B(8,29,78,10),hero:B(6,42,88,38),graphic:B(14,42,72,36),cta:B(8,84,50,8),legal:B(8,84,84,9)},
    wide:{background:B(0,0,100,100),logo:B(4,8,15,12),headline:B(4,24,38,28),copy:B(4,56,34,15),hero:B(45,3,36,94),graphic:B(48,8,32,82),cta:B(83,34,14,28),legal:B(4,80,72,12)},
    strip:{background:B(0,0,100,100),logo:B(2,16,10,68),headline:B(14,15,34,34),copy:B(14,55,32,24),hero:B(50,5,25,90),graphic:B(52,8,22,84),cta:B(78,24,20,52),legal:B(14,72,58,18)},
    "micro-strip":{background:B(0,0,100,100),logo:B(2,15,10,70),headline:B(14,18,40,64),copy:B(0,0,0,0),hero:B(57,4,20,92),graphic:B(59,8,18,84),cta:B(80,18,18,64),legal:B(14,24,62,52)}
  };
  return t[family][role]??B(8,8,30,20);
}

const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
export function adaptBox(layer:SceneLayer,targetFamily:LayoutFamily):Box{
  if(layer.role==="background")return B(0,0,100,100);
  if(targetFamily==="tall")return {...layer.masterBox};
  const source=templateFor("tall",layer.role);
  const target=templateFor(targetFamily,layer.role);
  if(source.w<=0||source.h<=0||target.w<=0||target.h<=0)return target;
  const rx=(layer.masterBox.x-source.x)/source.w;
  const ry=(layer.masterBox.y-source.y)/source.h;
  const rw=layer.masterBox.w/source.w;
  const rh=layer.masterBox.h/source.h;
  const bleed=layer.role==="hero"||layer.role==="graphic";
  const w=clamp(target.w*rw,Math.min(4,target.w),bleed?target.w*1.45:target.w);
  const h=clamp(target.h*rh,Math.min(4,target.h),bleed?target.h*1.45:target.h);
  const minX=bleed?target.x-target.w*.18:target.x,maxX=bleed?target.x+target.w*1.18-w:target.x+target.w-w;
  const minY=bleed?target.y-target.h*.18:target.y,maxY=bleed?target.y+target.h*1.18-h:target.y+target.h-h;
  return B(clamp(target.x+target.w*rx,minX,maxX),clamp(target.y+target.h*ry,minY,maxY),w,h);
}

export function motionVector(preset:MotionPreset,box:Box){
  const distance=Math.max(10,Math.min(30,Math.max(box.w,box.h)*0.45));
  if(preset==="from-left")return{x:-distance,y:0};
  if(preset==="from-right")return{x:distance,y:0};
  if(preset==="from-top")return{x:0,y:-distance};
  if(preset==="from-bottom")return{x:0,y:distance};
  return{x:0,y:0};
}

export function generateScene(scene:Scene,format:OutputFormat):GeneratedScene{
  const compact=format.family==="micro-strip";
  return {sceneId:scene.id,formatId:format.id,family:format.family,layers:scene.layers
    .filter(layer=>layer.visible&&!(compact&&layer.role==="copy"))
    .map(layer=>{
      const box=format.id==="master"?layer.masterBox:adaptBox(layer,format.family);
      const scale=Math.sqrt((format.width*format.height)/(MASTER_FORMAT.width*MASTER_FORMAT.height));
      const fontSize=layer.fontSize?Math.max(7,Math.min(layer.fontSize*1.3,layer.fontSize*clamp(scale,.55,1.2))):undefined;
      return {...layer,box,fontSize,motionVector:motionVector(layer.motion,box)};
    })};
}
