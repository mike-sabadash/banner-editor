export type LayerRole = "background" | "hero" | "logo" | "headline" | "copy" | "cta" | "legal" | "graphic";
export type MotionPreset = "none" | "fade" | "from-left" | "from-right" | "from-top" | "from-bottom" | "scale-in";
export type LayoutFamily = "portrait" | "tall" | "rectangle" | "wide" | "strip" | "micro-strip";

export type SceneLayer = {
  id: string;
  name: string;
  role: LayerRole;
  text?: string;
  color?: string;
  assetUrl?: string;
  motion: MotionPreset;
  durationMs: number;
  easing: "ease-out" | "ease-in-out" | "linear";
  visible: boolean;
};

export type Scene = {
  id: string;
  name: string;
  durationMs: number;
  layers: SceneLayer[];
};

export type OutputFormat = { id:string; width:number; height:number; label:string; family:LayoutFamily };
export type Box = { x:number; y:number; w:number; h:number };
export type GeneratedLayer = SceneLayer & { box:Box; fontSize?:number; motionVector:{x:number;y:number} };
export type GeneratedScene = { sceneId:string; formatId:string; family:LayoutFamily; layers:GeneratedLayer[] };

export const RU_CORE_10: OutputFormat[] = [
  ["240x400",240,400],["300x250",300,250],["300x300",300,300],["300x500",300,500],["300x600",300,600],
  ["160x600",160,600],["728x90",728,90],["970x250",970,250],["320x50",320,50],["320x100",320,100]
].map(([id,width,height])=>({id:String(id),width:Number(width),height:Number(height),label:String(id),family:familyFor(Number(width),Number(height))}));

export function familyFor(width:number,height:number):LayoutFamily{
  const ratio=width/height;
  if(height<=60)return "micro-strip";
  if(height<=120||ratio>=3.2)return "strip";
  if(ratio>=2.3)return "wide";
  if(height/width>=1.7)return "tall";
  if(height>width)return "portrait";
  return "rectangle";
}

export const DEFAULT_SCENES: Scene[] = [
  {id:"scene-1",name:"Product",durationMs:2200,layers:[
    {id:"bg-1",name:"Background",role:"background",color:"#0f172a",motion:"none",durationMs:0,easing:"linear",visible:true},
    {id:"hero-1",name:"Hero",role:"hero",color:"#38bdf8",motion:"from-right",durationMs:600,easing:"ease-out",visible:true},
    {id:"headline-1",name:"Headline",role:"headline",text:"Летний запуск",color:"#ffffff",motion:"from-left",durationMs:450,easing:"ease-out",visible:true},
    {id:"copy-1",name:"Copy",role:"copy",text:"Новый продукт уже здесь",color:"#cbd5e1",motion:"fade",durationMs:350,easing:"ease-out",visible:true}
  ]},
  {id:"scene-2",name:"Offer",durationMs:2200,layers:[
    {id:"bg-2",name:"Background 2",role:"background",color:"#4c1d95",motion:"fade",durationMs:250,easing:"ease-out",visible:true},
    {id:"graphic-2",name:"Graphic",role:"graphic",color:"#f59e0b",motion:"scale-in",durationMs:500,easing:"ease-out",visible:true},
    {id:"headline-2",name:"Headline 2",role:"headline",text:"−30% до воскресенья",color:"#ffffff",motion:"from-bottom",durationMs:450,easing:"ease-out",visible:true},
    {id:"cta-2",name:"CTA",role:"cta",text:"Подробнее",color:"#ffffff",motion:"fade",durationMs:300,easing:"ease-out",visible:true}
  ]},
  {id:"scene-3",name:"Legal",durationMs:1600,layers:[
    {id:"bg-3",name:"End card",role:"background",color:"#111827",motion:"fade",durationMs:250,easing:"ease-out",visible:true},
    {id:"logo-3",name:"Logo",role:"logo",text:"BRAND",color:"#ffffff",motion:"scale-in",durationMs:350,easing:"ease-out",visible:true},
    {id:"legal-3",name:"Legal",role:"legal",text:"Реклама. Подробности на сайте.",color:"#d1d5db",motion:"fade",durationMs:350,easing:"ease-out",visible:true}
  ]}
];

const B=(x:number,y:number,w:number,h:number):Box=>({x,y,w,h});

export function templateFor(family:LayoutFamily,role:LayerRole):Box{
  const templates:Record<LayoutFamily,Partial<Record<LayerRole,Box>>>={
    rectangle:{background:B(0,0,100,100),logo:B(6,6,22,10),headline:B(6,12,42,24),copy:B(6,40,38,18),hero:B(52,4,44,72),graphic:B(54,10,40,64),cta:B(6,76,30,14),legal:B(6,84,88,10)},
    portrait:{background:B(0,0,100,100),logo:B(7,5,28,9),headline:B(7,14,86,18),copy:B(7,34,80,12),hero:B(6,48,88,34),graphic:B(14,44,72,34),cta:B(7,84,42,10),legal:B(7,84,86,10)},
    tall:{background:B(0,0,100,100),logo:B(8,4,32,7),headline:B(8,12,84,16),copy:B(8,29,78,10),hero:B(6,42,88,38),graphic:B(14,42,72,36),cta:B(8,84,50,8),legal:B(8,84,84,9)},
    wide:{background:B(0,0,100,100),logo:B(4,8,15,12),headline:B(4,24,38,28),copy:B(4,56,34,15),hero:B(45,3,36,94),graphic:B(48,8,32,82),cta:B(83,34,14,28),legal:B(4,80,72,12)},
    strip:{background:B(0,0,100,100),logo:B(2,16,10,68),headline:B(14,15,34,34),copy:B(14,55,32,24),hero:B(50,5,25,90),graphic:B(52,8,22,84),cta:B(78,24,20,52),legal:B(14,72,58,18)},
    "micro-strip":{background:B(0,0,100,100),logo:B(2,15,10,70),headline:B(14,18,40,64),copy:B(0,0,0,0),hero:B(57,4,20,92),graphic:B(59,8,18,84),cta:B(80,18,18,64),legal:B(14,24,62,52)}
  };
  return templates[family][role] ?? B(8,8,30,20);
}

export function motionVector(preset:MotionPreset,box:Box){
  const distance=Math.max(10,Math.min(28,Math.max(box.w,box.h)*0.45));
  if(preset==="from-left")return{x:-distance,y:0};
  if(preset==="from-right")return{x:distance,y:0};
  if(preset==="from-top")return{x:0,y:-distance};
  if(preset==="from-bottom")return{x:0,y:distance};
  return{x:0,y:0};
}

export function generateScene(scene:Scene,format:OutputFormat):GeneratedScene{
  const compact=format.family==="micro-strip";
  return {sceneId:scene.id,formatId:format.id,family:format.family,layers:scene.layers.filter(l=>l.visible).filter(l=>!(compact&&l.role==="copy")).map(layer=>{
    const box=templateFor(format.family,layer.role);
    const fontSize=layer.role==="headline"?Math.max(10,Math.min(34,format.height*0.12)):layer.role==="copy"||layer.role==="legal"?Math.max(7,Math.min(16,format.height*0.055)):undefined;
    return {...layer,box,fontSize,motionVector:motionVector(layer.motion,box)};
  })};
}
