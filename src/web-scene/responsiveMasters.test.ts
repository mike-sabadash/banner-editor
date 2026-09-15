import {describe,expect,it} from "vitest";
import {
  DEFAULT_SCENES,EMPTY_RESPONSIVE_STATE,RU_CORE_10,affectedFormatsForFamily,countFormatOverrides,
  familyFor,formatInheritance,generateScene,resetFormatOverride,resetLayerOverride,resetOverrideProperty,
  responsiveMasterScore,selectResponsiveMaster,setLayerOverride,updateResponsiveMaster,useAsResponsiveMaster,
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
});
