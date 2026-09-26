import {describe,expect,it} from "vitest";
import {
  DEFAULT_SCENES,EMPTY_RESPONSIVE_STATE,RU_CORE_10,affectedFormatsForFamily,countFormatOverrides,
  familyFor,formatInheritance,generateScene,resetFormatOverride,resetLayerOverride,resetOverrideProperty,
  responsiveMasterScore,selectResponsiveMaster,setLayerOverride,updateResponsiveMaster,useAsResponsiveMaster,recommendedManualMasterFormats,
  type OutputFormat,type ResponsiveState
} from "./sceneModel";

const format=(id:string)=>RU_CORE_10.find(item=>item.id===id)!;
const headline=(id:string,state:ResponsiveState)=>generateScene(DEFAULT_SCENES[0],format(id),state).layers.find(layer=>layer.role==="headline")!;

describe("Responsive Masters end-to-end",()=>{
  it("classifies every acceptance size without mixing extreme geometry",()=>{
    const expected:Record<string,string>={"120x600":"tall","160x600":"tall","240x400":"portrait","300x250":"rectangle","300x300":"rectangle","320x50":"micro-strip","320x480":"portrait","336x280":"rectangle","728x90":"strip","970x90":"strip","970x250":"wide","1000x120":"strip"};
    for(const [size,family] of Object.entries(expected)){const [w,h]=size.split("x").map(Number);expect(familyFor(w,h),size).toBe(family)}
  });

  it("promotes edited portrait, rectangle, tall and strip formats and rebuilds their relatives",()=>{
    let state:ResponsiveState=EMPTY_RESPONSIVE_STATE;
    state=setLayerOverride(state,"240x400","scene-1","headline-1","headline",{box:{x:11,y:9,w:70,h:22},fontSize:30,motion:"from-left",motionDurationMs:610,easing:"ease-in-out"});
    state=useAsResponsiveMaster(DEFAULT_SCENES,format("240x400"),state,"portrait","2026-09-15T00:00:00Z");
    expect(headline("320x480",state)).toMatchObject({box:{x:11,y:9,w:70,h:22},motion:"from-left",motionDurationMs:610,easing:"ease-in-out"});
    expect(headline("320x480",state).motionVector.x).toBeLessThan(0);
    expect(formatInheritance(format("320x480"),state)).toMatchObject({kind:"inherited",sourceFormatId:"240x400"});

    state=setLayerOverride(state,"300x300","scene-1","headline-1","headline",{box:{x:6,y:7,w:45,h:29}});
    state=useAsResponsiveMaster(DEFAULT_SCENES,format("300x300"),state,"rectangle");
    expect(headline("300x250",state).box).toEqual({x:6,y:7,w:45,h:29});
    expect(selectResponsiveMaster(format("336x280"),state)?.sourceFormatId).toBe("300x300");

    state=setLayerOverride(state,"160x600","scene-1","headline-1","headline",{box:{x:8,y:10,w:84,h:14}});
    state=useAsResponsiveMaster(DEFAULT_SCENES,format("160x600"),state,"tall");
    expect(headline("120x600",state).box).toEqual({x:8,y:10,w:84,h:14});
    expect(selectResponsiveMaster(format("240x400"),state)?.sourceFormatId).toBe("240x400");

    state=setLayerOverride(state,"728x90","scene-1","headline-1","headline",{box:{x:13,y:12,w:36,h:42}});
    state=useAsResponsiveMaster(DEFAULT_SCENES,format("728x90"),state,"strip");
    expect(headline("970x90",state).box).toEqual({x:13,y:12,w:36,h:42});
    expect(headline("1000x120",state).box).toEqual({x:13,y:12,w:36,h:42});
    expect(selectResponsiveMaster(format("320x50"),state)).toBeUndefined();
    expect(selectResponsiveMaster(format("970x250"),state)).toBeUndefined();
  });

  it("keeps individual property overrides after repeated Update family",()=>{
    let state=setLayerOverride(EMPTY_RESPONSIVE_STATE,"240x400","scene-1","headline-1","headline",{box:{x:10,y:10,w:75,h:20}});
    state=useAsResponsiveMaster(DEFAULT_SCENES,format("240x400"),state,"portrait");
    state=setLayerOverride(state,"320x480","scene-1","headline-1","headline",{box:{x:4,y:5,w:61,h:18},text:"Individual"});
    state=setLayerOverride(state,"240x400","scene-1","headline-1","headline",{box:{x:16,y:12,w:68,h:24},motion:"from-right"});
    const master=selectResponsiveMaster(format("240x400"),state)!;
    state=updateResponsiveMaster(DEFAULT_SCENES,master.id,RU_CORE_10,state,"2026-09-15T01:00:00Z");
    expect(headline("320x480",state)).toMatchObject({box:{x:4,y:5,w:61,h:18},text:"Individual",motion:"from-right"});
    expect(countFormatOverrides(state,"320x480")).toBe(2);
    expect(countFormatOverrides(state,"240x400")).toBe(0);
  });

  it("resets a property, a layer, or a whole format to inherited values",()=>{
    let state=useAsResponsiveMaster(DEFAULT_SCENES,format("240x400"),EMPTY_RESPONSIVE_STATE,"portrait");
    state=setLayerOverride(state,"320x480","scene-1","headline-1","headline",{box:{x:1,y:2,w:3,h:4},text:"Override"});
    state=resetOverrideProperty(state,"320x480","scene-1","headline-1","box");
    expect(headline("320x480",state).text).toBe("Override");
    expect(headline("320x480",state).box).not.toEqual({x:1,y:2,w:3,h:4});
    state=resetLayerOverride(state,"320x480","scene-1","headline-1");
    expect(countFormatOverrides(state,"320x480")).toBe(0);
    state=setLayerOverride(state,"320x480","scene-1","headline-1","headline",{text:"Again"});
    state=resetFormatOverride(state,"320x480");
    expect(formatInheritance(format("320x480"),state).kind).toBe("inherited");
  });

  it("captures every scene independently and falls back by semantic role when ids differ",()=>{
    const scenes=structuredClone(DEFAULT_SCENES);
    scenes.push({id:"scene-unique",name:"Unique",durationMs:1000,layers:[{...scenes[2].layers[1],id:"only-logo",role:"logo",masterBox:{x:20,y:20,w:40,h:15}}]});
    const state=useAsResponsiveMaster(scenes,format("240x400"),EMPTY_RESPONSIVE_STATE,"portrait");
    const master=state.responsiveMasters[0];
    expect(Object.keys(master.scenes)).toEqual(["scene-1","scene-2","scene-3","scene-unique"]);
    expect(master.scenes["scene-unique"].layers["only-logo"].role).toBe("logo");
    const renamed=structuredClone(scenes[3]);renamed.layers[0].id="renamed-logo";
    expect(generateScene(renamed,format("320x480"),state).layers[0].box).toEqual(master.scenes["scene-unique"].layers["only-logo"].box);
  });

  it("scores by aspect and size only inside the same non-extreme family",()=>{
    const stateA=useAsResponsiveMaster(DEFAULT_SCENES,format("240x400"),EMPTY_RESPONSIVE_STATE,"portrait");
    const a=stateA.responsiveMasters[0];
    const b={...a,id:"responsive-portrait-320x480",sourceFormatId:"320x480",width:320,height:480,label:"320x480"};
    const state={responsiveMasters:[a,b],formatOverrides:{}};
    expect(selectResponsiveMaster({id:"custom",width:300,height:450,label:"custom",family:"portrait"},state)?.id).toBe(b.id);
    expect(responsiveMasterScore(a,format("160x600"))).toBe(Infinity);
    expect(affectedFormatsForFamily("strip",RU_CORE_10).map(item=>item.id)).toEqual(expect.arrayContaining(["728x90","970x90","1000x120"]));
  });
  it("rolls a real multi-role composition from Original Master through a curated Family Master into intermediate formats",()=>{
    const scenes=structuredClone(DEFAULT_SCENES);
    const product=scenes[0];
    product.layers.push(
      {id:"logo-rollout",name:"Brand logo",kind:"text",role:"logo",text:"BRAND",color:"#fff",masterBox:{x:8,y:4,w:30,h:8},fontSize:22,fontWeight:800,fontFamily:"Inter",motion:"fade",motionDurationMs:260,easing:"ease-out",startMs:0,endMs:2200,visible:true},
      {id:"cta-rollout",name:"CTA",kind:"text",role:"cta",text:"Shop now",color:"#fff",masterBox:{x:8,y:84,w:42,h:8},fontSize:14,fontWeight:700,fontFamily:"Inter",motion:"fade",motionDurationMs:280,easing:"ease-out",startMs:500,endMs:2200,visible:true},
      {id:"legal-rollout",name:"Legal",kind:"text",role:"legal",text:"Terms apply",color:"#aaa",masterBox:{x:8,y:94,w:84,h:4},fontSize:9,fontWeight:400,fontFamily:"Inter",motion:"none",motionDurationMs:0,easing:"linear",startMs:0,endMs:2200,visible:true}
    );
    const family=format("300x300"),intermediate=format("300x250"),sibling=format("336x280");
    const deterministic=generateScene(product,family,EMPTY_RESPONSIVE_STATE);
    expect(deterministic.layers.find(l=>l.role==="hero")!.box).not.toEqual(product.layers.find(l=>l.role==="hero")!.masterBox);
    let state:ResponsiveState=EMPTY_RESPONSIVE_STATE;
    const curated:{id:string;role:any;box:{x:number;y:number;w:number;h:number};fontSize?:number}[]=[
      {id:"headline-1",role:"headline",box:{x:6,y:8,w:44,h:24},fontSize:27},
      {id:"hero-1",role:"hero",box:{x:53,y:8,w:41,h:66}},
      {id:"logo-rollout",role:"logo",box:{x:6,y:4,w:22,h:9},fontSize:18},
      {id:"cta-rollout",role:"cta",box:{x:6,y:76,w:30,h:13},fontSize:13},
      {id:"legal-rollout",role:"legal",box:{x:6,y:91,w:88,h:6},fontSize:8}
    ];
    for(const item of curated)state=setLayerOverride(state,family.id,product.id,item.id,item.role,{box:item.box,...(item.fontSize?{fontSize:item.fontSize}:{})});
    state=useAsResponsiveMaster(scenes,family,state,"rectangle","2026-09-24T00:00:00Z");
    expect(formatInheritance(family,state)).toMatchObject({kind:"responsive-master",sourceFormatId:"300x300"});
    for(const target of [intermediate,sibling]){
      expect(formatInheritance(target,state)).toMatchObject({kind:"inherited",sourceFormatId:"300x300"});
      const output=generateScene(product,target,state);
      for(const item of curated){const layer=output.layers.find(l=>l.id===item.id)!;expect(layer.box,item.id+" @ "+target.id).toEqual(item.box);expect(layer.visible).toBe(true)}
      expect(output.layers.find(l=>l.id==="headline-1")!.fontSize).toBeGreaterThanOrEqual(7);
      expect(output.layers.find(l=>l.id==="legal-rollout")!.box.y+output.layers.find(l=>l.id==="legal-rollout")!.box.h).toBeLessThanOrEqual(100);
    }
    state=setLayerOverride(state,intermediate.id,product.id,"cta-rollout","cta",{box:{x:8,y:73,w:34,h:15}});
    expect(formatInheritance(intermediate,state).kind).toBe("individual");
    expect(generateScene(product,intermediate,state).layers.find(l=>l.id==="cta-rollout")!.box).toEqual({x:8,y:73,w:34,h:15});
    expect(generateScene(product,sibling,state).layers.find(l=>l.id==="cta-rollout")!.box).toEqual({x:6,y:76,w:30,h:13});
  });

  it("keeps critical content viable across extreme skyscraper, micro-strip, strip, wide, square, portrait and fullscreen layouts",()=>{
    const scenes=structuredClone(DEFAULT_SCENES),product=scenes[0];
    product.layers.push(
      {id:"logo-extreme",name:"Logo",kind:"text",role:"logo",text:"BRAND",color:"#fff",masterBox:{x:8,y:4,w:30,h:8},fontSize:22,fontWeight:800,fontFamily:"Inter",motion:"fade",motionDurationMs:250,easing:"ease-out",startMs:0,endMs:2200,visible:true},
      {id:"cta-extreme",name:"CTA",kind:"text",role:"cta",text:"Shop",color:"#fff",masterBox:{x:8,y:84,w:42,h:8},fontSize:14,fontWeight:700,fontFamily:"Inter",motion:"fade",motionDurationMs:250,easing:"ease-out",startMs:400,endMs:2200,visible:true},
      {id:"legal-extreme",name:"Legal",kind:"text",role:"legal",text:"Terms apply",color:"#aaa",masterBox:{x:8,y:94,w:84,h:4},fontSize:9,fontWeight:400,fontFamily:"Inter",motion:"none",motionDurationMs:0,easing:"linear",startMs:0,endMs:2200,visible:true}
    );
    const targets:OutputFormat[]=[
      format("120x600"),format("320x50"),format("728x90"),format("970x250"),format("300x300"),format("240x400"),
      {id:"360x780-fullscreen",width:360,height:780,label:"360x780 Fullscreen",family:familyFor(360,780)}
    ];
    for(const target of targets){
      const layers=generateScene(product,target,EMPTY_RESPONSIVE_STATE).layers;
      const byRole=(role:string)=>layers.find(layer=>layer.role===role)!;
      for(const role of ["background","headline","hero","logo","cta","legal"]){const layer=byRole(role);expect(layer,role+" @ "+target.id).toBeTruthy();expect(layer.visible,role+" visible @ "+target.id).toBe(true);expect(Number.isFinite(layer.box.x)&&Number.isFinite(layer.box.y)&&layer.box.w>0&&layer.box.h>0,role+" geometry @ "+target.id).toBe(true)}
      for(const role of ["headline","logo","cta","legal"]){const b=byRole(role).box;expect(b.x,role+" x @ "+target.id).toBeGreaterThanOrEqual(0);expect(b.y,role+" y @ "+target.id).toBeGreaterThanOrEqual(0);expect(b.x+b.w,role+" right @ "+target.id).toBeLessThanOrEqual(100.001);expect(b.y+b.h,role+" bottom @ "+target.id).toBeLessThanOrEqual(100.001)}
      if(target.family==="micro-strip")expect(layers.some(layer=>layer.role==="copy")).toBe(false);
      else expect(layers.some(layer=>layer.role==="copy")).toBe(true);
    }
  });

  it("uses only six manual masters to cover every responsive geometry family",()=>{
    const masters=recommendedManualMasterFormats();
    expect(masters.map(item=>item.id)).toEqual(["300x600","240x400","300x300","970x250","728x90","320x50"]);
    expect(new Set(masters.map(item=>item.family))).toEqual(new Set(["tall","portrait","rectangle","wide","strip","micro-strip"]));
    let state:ResponsiveState=EMPTY_RESPONSIVE_STATE;
    for(const master of masters)state=useAsResponsiveMaster(DEFAULT_SCENES,master,state,master.family);
    for(const target of RU_CORE_10){const selected=selectResponsiveMaster(target,state);expect(selected,target.id).toBeTruthy();expect(selected!.family,target.id).toBe(target.family)}
  });

});
