import {useMemo,useState,type PointerEvent as ReactPointerEvent} from "react";
import type {BezierCurve,BounceConfig,EasingPreset,MotionPreset,SceneLayer} from "./sceneModel";
import BounceCurveEditor from "./BounceCurveEditor";
import {SPRING_PRESETS,springConfig,type SpringPresetId} from "./springRuntime";
import "./motionInspector.css";

const TRANSFORMS:{id:MotionPreset;label:string;glyph:string}[]=[
 {id:"from-left",label:"From left",glyph:"→"},{id:"from-right",label:"From right",glyph:"←"},
 {id:"from-top",label:"From top",glyph:"↓"},{id:"from-bottom",label:"From bottom",glyph:"↑"},{id:"scale-in",label:"Scale",glyph:"↗"},{id:"bounce",label:"Bounce",glyph:"↕"}
];
const CURVES:Record<Exclude<EasingPreset,"cubic-bezier">,BezierCurve>={
 "linear":[0,0,1,1],"ease-in":[.42,0,1,1],"ease-out":[0,0,.58,1],"ease-in-out":[.42,0,.58,1]
};
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const curveFor=(preset:EasingPreset,custom?:BezierCurve):BezierCurve=>preset==="cubic-bezier"?(custom??[.25,.1,.25,1]):CURVES[preset];

type Mode="in"|"out";
type Props={layer:SceneLayer;patch:(patch:Partial<SceneLayer>)=>void;checkpoint?:()=>void};

function BezierEditor({mode,layer,patch}:{mode:Mode;layer:SceneLayer;patch:Props["patch"]}){
 const preset:EasingPreset=mode==="in"?layer.easing:(layer.outEasing??layer.easing);
 const curve=useMemo(()=>curveFor(preset,mode==="in"?layer.easingBezier:layer.outEasingBezier),[preset,mode,layer.easingBezier,layer.outEasingBezier]);
 const apply=(next:BezierCurve)=>patch(mode==="in"?{easing:"cubic-bezier",easingBezier:next}:{outEasing:"cubic-bezier",outEasingBezier:next});
 const choose=(next:EasingPreset)=>patch(mode==="in"?{easing:next,easingBezier:next==="cubic-bezier"?curve:undefined}:{outEasing:next,outEasingBezier:next==="cubic-bezier"?curve:undefined});
 const drag=(index:0|1,e:ReactPointerEvent<SVGCircleElement>)=>{e.preventDefault();const svg=e.currentTarget.ownerSVGElement;if(!svg)return;e.currentTarget.setPointerCapture?.(e.pointerId);const move=(ev:PointerEvent)=>{const r=svg.getBoundingClientRect(),padX=r.width*.05,padY=r.height*.05,w=r.width*.9,h=r.height*.9;const next=[...curve] as BezierCurve;next[index*2]=clamp((ev.clientX-r.left-padX)/w,0,1);next[index*2+1]=clamp(1-(ev.clientY-r.top-padY)/h,-.75,1.75);apply(next)};const up=()=>{removeEventListener("pointermove",move);removeEventListener("pointerup",up)};addEventListener("pointermove",move);addEventListener("pointerup",up)};
 const setNumber=(index:number,value:string)=>{const next=[...curve] as BezierCurve;next[index]=clamp(Number(value)||0,index%2?-.75:0,index%2?1.75:1);apply(next)};
 const padX=8,padY=7,spanX=159,spanY=86,px=(v:number)=>padX+v*spanX,py=(v:number)=>padY+(1-v)*spanY;
 const path=`M ${padX} ${padY+spanY} C ${px(curve[0])} ${py(curve[1])}, ${px(curve[2])} ${py(curve[3])}, ${padX+spanX} ${padY}`;
 return <div className="bm-bezier">
  <div className="bm-bezier-top"><div><small>{mode.toUpperCase()} EASING</small><strong>{preset==="cubic-bezier"?"Custom Bézier":preset.replaceAll("-"," ")}</strong></div>
   <select value={preset} onChange={e=>choose(e.target.value as EasingPreset)}><option value="ease-out">Ease out</option><option value="ease-in">Ease in</option><option value="ease-in-out">Ease in & out</option><option value="linear">Linear</option><option value="cubic-bezier">Custom Bézier</option></select></div>
  <div className="bm-bezier-canvas"><svg viewBox="0 0 175 100" preserveAspectRatio="xMidYMid meet">
   <path className="grid" d="M8 28.5H167 M8 50H167 M8 71.5H167 M47.75 7V93 M87.5 7V93 M127.25 7V93"/>
   <path className="guide" d={`M${padX} ${padY+spanY} L${px(curve[0])} ${py(curve[1])} M${padX+spanX} ${padY} L${px(curve[2])} ${py(curve[3])}`}/>
   <path className="curve" d={path}/><circle className="end" cx={padX} cy={padY+spanY} r="1.5"/><circle className="end" cx={padX+spanX} cy={padY} r="1.5"/>
   <circle className="handle" cx={px(curve[0])} cy={py(curve[1])} r="2.8" onPointerDown={e=>drag(0,e)}/><circle className="handle" cx={px(curve[2])} cy={py(curve[3])} r="2.8" onPointerDown={e=>drag(1,e)}/>
  </svg></div>
  <div className="bm-bezier-values">{curve.map((v,i)=><label key={i}><span>{i<2?"P1":"P2"} {i%2?"Y":"X"}</span><input type="number" step=".01" value={Number(v.toFixed(2))} onChange={e=>setNumber(i,e.target.value)}/></label>)}</div>
 </div>
}

function Transition({mode,layer,patch,checkpoint}:{mode:Mode;layer:SceneLayer;patch:Props["patch"];checkpoint?:()=>void}){
 const [bounceCurveOpen,setBounceCurveOpen]=useState(false);
 const raw=mode==="in"?layer.motion:(layer.outMotion??"none"),transform=raw==="fade"?"none":raw;
 const fade=mode==="in"?!!(layer.inOpacity||layer.motion==="fade"):!!(layer.outOpacity||(layer.outMotion??"none")==="fade");
 const duration=mode==="in"?layer.motionDurationMs:(layer.outMotionDurationMs??0);
 const edit=(next:Partial<SceneLayer>)=>{checkpoint?.();patch(next)};\n const setTransform=(id:MotionPreset)=>edit(mode==="in"?{motion:id}:{outMotion:id,outMotionDurationMs:id==="none"&&!fade?0:(layer.outMotionDurationMs||320)});
 const setFade=()=>edit(mode==="in"?{inOpacity:!fade,motion:layer.motion==="fade"?"none":layer.motion}:{outOpacity:!fade,outMotion:(layer.outMotion??"none")==="fade"?"none":layer.outMotion,outMotionDurationMs:layer.outMotionDurationMs||320});
 const reset=()=>edit(mode==="in"?{motion:"none",inOpacity:false}:{outMotion:"none",outOpacity:false,outMotionDurationMs:0});
 const none=transform==="none"&&!fade;
 const bounce=springConfig(mode==="in"?(layer.inBounce??{preset:layer.bouncePreset==="soft"?"soft":layer.bouncePreset==="lively"?"bouncy":"single",direction:layer.bounceDirection??"down",distance:Math.max(.1,(layer.bounceIntensity??100)/100),offscreen:false,bounce:.12,velocity:.55}):(layer.outBounce??{preset:"single",direction:layer.bounceDirection??"up",distance:1,offscreen:false,bounce:.12,velocity:.55}));
 const patchBounce=(next:Partial<BounceConfig>,record=true)=>{const value={...bounce,...next} as BounceConfig;if(record)checkpoint?.();patch(mode==="in"?{inBounce:value}:{outBounce:value})};
 const chooseBouncePreset=(preset:SpringPresetId)=>patchBounce({preset,...SPRING_PRESETS[preset]});
 return <section className="bm-transition"><header><div><small>{mode.toUpperCase()}</small><h4>Effects</h4></div><span>Duration {Math.round(duration)} ms</span></header>
  <div className="bm-fx-grid">
   <button className={none?"active":""} onClick={reset}><i>•</i><b>None</b></button>
   <button className={fade?"active":""} onClick={setFade}><i>◌</i><b>Fade</b></button>
   {TRANSFORMS.map(p=><button key={p.id} className={transform===p.id?"active":""} onClick={()=>setTransform(p.id)}><i>{p.glyph}</i><b>{p.label}</b></button>)}
  </div>
  {transform==="bounce"&&<div className="bm-bounce-controls">
   <div className="bm-bounce-direction"><span>Direction</span><div>{(["up","down","left","right"] as const).map((id,i)=><button key={id} className={bounce.direction===id?"active":""} onClick={()=>patchBounce({direction:id})}>{["↑","↓","←","→"][i]}</button>)}</div></div>
   <div className="bm-bounce-preset-row"><span>Preset</span><select value={bounce.preset} onChange={e=>{const id=e.target.value as SpringPresetId|"custom";if(id!=="custom")chooseBouncePreset(id)}}><option value="soft">Soft</option><option value="drop">Drop</option><option value="single">Single inertia</option><option value="bouncy">Bouncy</option>{bounce.preset==="custom"&&<option value="custom">Custom</option>}</select><button className="bm-bounce-curve-trigger" onClick={()=>setBounceCurveOpen(v=>!v)} title="Edit bounce curve">⌁</button></div>
   <label><span>Duration</span><input type="range" min="160" max="2200" step="20" value={duration||600} onChange={e=>patch(mode==="in"?{motionDurationMs:Number(e.target.value)}:{outMotionDurationMs:Number(e.target.value)})}/><b>{duration||600} ms</b></label>
   <label><span>Distance</span><input type="range" min=".1" max="3" step=".05" value={bounce.distance} onChange={e=>patchBounce({distance:Number(e.target.value)})}/><b>{bounce.distance.toFixed(2)}×</b></label>
   <label><span>Bounce</span><input type="range" min="-.25" max=".5" step=".01" value={bounce.bounce} onChange={e=>patchBounce({bounce:Number(e.target.value),preset:"custom"})}/><b>{bounce.bounce.toFixed(2)}</b></label>
   <label><span>Velocity</span><input type="range" min="-1" max="4" step=".05" value={bounce.velocity} onChange={e=>patchBounce({velocity:Number(e.target.value),preset:"custom"})}/><b>{bounce.velocity.toFixed(2)}</b></label>
   <label className="bm-bounce-offscreen"><span>Start</span><input type="checkbox" checked={bounce.offscreen} onChange={e=>patchBounce({offscreen:e.target.checked})}/><b>{bounce.offscreen?"Off canvas":"Relative"}</b></label>
   {bounceCurveOpen&&<div className="bm-bounce-curve-popover"><BounceCurveEditor config={bounce} duration={duration||600} onGestureStart={checkpoint} onChange={next=>patch(mode==="in"?{inBounce:next}:{outBounce:next})} onClose={()=>setBounceCurveOpen(false)}/></div>}
  </div>}
  <BezierEditor mode={mode} layer={layer} patch={patch}/>
 </section>
}
export default function MotionInspector({layer,patch,checkpoint}:Props){return <div className="bm-motion-inspector"><Transition mode="in" layer={layer} patch={patch} checkpoint={checkpoint}/><Transition mode="out" layer={layer} patch={patch} checkpoint={checkpoint}/></div>}
