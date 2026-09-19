import {useMemo,type PointerEvent as ReactPointerEvent} from "react";
import type {BezierCurve,EasingPreset,MotionPreset,SceneLayer} from "./sceneModel";
import "./motionInspector.css";

const TRANSFORMS:{id:MotionPreset;label:string;glyph:string}[]=[
 {id:"from-left",label:"From left",glyph:"→"},{id:"from-right",label:"From right",glyph:"←"},
 {id:"from-top",label:"From top",glyph:"↓"},{id:"from-bottom",label:"From bottom",glyph:"↑"},{id:"scale-in",label:"Scale",glyph:"↗"}
];
const CURVES:Record<Exclude<EasingPreset,"cubic-bezier">,BezierCurve>={
 "linear":[0,0,1,1],"ease-in":[.42,0,1,1],"ease-out":[0,0,.58,1],"ease-in-out":[.42,0,.58,1]
};
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));
const curveFor=(preset:EasingPreset,custom?:BezierCurve):BezierCurve=>preset==="cubic-bezier"?(custom??[.25,.1,.25,1]):CURVES[preset];

type Mode="in"|"out";
type Props={layer:SceneLayer;patch:(patch:Partial<SceneLayer>)=>void};

function BezierEditor({mode,layer,patch}:{mode:Mode;layer:SceneLayer;patch:Props["patch"]}){
 const preset:EasingPreset=mode==="in"?layer.easing:(layer.outEasing??layer.easing);
 const curve=useMemo(()=>curveFor(preset,mode==="in"?layer.easingBezier:layer.outEasingBezier),[preset,mode,layer.easingBezier,layer.outEasingBezier]);
 const apply=(next:BezierCurve)=>patch(mode==="in"?{easing:"cubic-bezier",easingBezier:next}:{outEasing:"cubic-bezier",outEasingBezier:next});
 const choose=(next:EasingPreset)=>patch(mode==="in"?{easing:next,easingBezier:next==="cubic-bezier"?curve:undefined}:{outEasing:next,outEasingBezier:next==="cubic-bezier"?curve:undefined});
 const drag=(index:0|1,e:ReactPointerEvent<SVGCircleElement>)=>{e.preventDefault();const svg=e.currentTarget.ownerSVGElement;if(!svg)return;e.currentTarget.setPointerCapture?.(e.pointerId);const move=(ev:PointerEvent)=>{const r=svg.getBoundingClientRect(),padX=r.width*.05,padY=r.height*.05,w=r.width*.9,h=r.height*.9;const next=[...curve] as BezierCurve;next[index*2]=clamp((ev.clientX-r.left-padX)/w,0,1);next[index*2+1]=clamp(1-(ev.clientY-r.top-padY)/h,-.75,1.75);apply(next)};const up=()=>{removeEventListener("pointermove",move);removeEventListener("pointerup",up)};addEventListener("pointermove",move);addEventListener("pointerup",up)};
 const setNumber=(index:number,value:string)=>{const next=[...curve] as BezierCurve;next[index]=clamp(Number(value)||0,index%2?-.75:0,index%2?1.75:1);apply(next)};
 const path=`M 0 100 C ${curve[0]*100} ${100-curve[1]*100}, ${curve[2]*100} ${100-curve[3]*100}, 100 0`;
 return <div className="bm-bezier">
  <div className="bm-bezier-top"><div><small>{mode.toUpperCase()} EASING</small><strong>{preset==="cubic-bezier"?"Custom Bézier":preset.replaceAll("-"," ")}</strong></div>
   <select value={preset} onChange={e=>choose(e.target.value as EasingPreset)}><option value="ease-out">Ease out</option><option value="ease-in">Ease in</option><option value="ease-in-out">Ease in & out</option><option value="linear">Linear</option><option value="cubic-bezier">Custom Bézier</option></select></div>
  <div className="bm-bezier-canvas"><svg viewBox="0 0 100 100" preserveAspectRatio="none">
   <path className="grid" d="M5 27.5H95 M5 50H95 M5 72.5H95 M27.5 5V95 M50 5V95 M72.5 5V95"/>
   <path className="guide" d={`M0 100 L${curve[0]*100} ${100-curve[1]*100} M100 0 L${curve[2]*100} ${100-curve[3]*100}`}/>
   <path className="curve" d={path}/><circle className="end" cx={pad} cy={pad+span} r="1.5"/><circle className="end" cx={pad+span} cy={pad} r="1.5"/>
   <circle className="handle" cx={px(curve[0])} cy={py(curve[1])} r="2.8" onPointerDown={e=>drag(0,e)}/><circle className="handle" cx={px(curve[2])} cy={py(curve[3])} r="2.8" onPointerDown={e=>drag(1,e)}/>
  </svg></div>
  <div className="bm-bezier-values">{curve.map((v,i)=><label key={i}><span>{i<2?"P1":"P2"} {i%2?"Y":"X"}</span><input type="number" step=".01" value={Number(v.toFixed(2))} onChange={e=>setNumber(i,e.target.value)}/></label>)}</div>
 </div>
}

function Transition({mode,layer,patch}:{mode:Mode;layer:SceneLayer;patch:Props["patch"]}){
 const raw=mode==="in"?layer.motion:(layer.outMotion??"none"),transform=raw==="fade"?"none":raw;
 const fade=mode==="in"?!!(layer.inOpacity||layer.motion==="fade"):!!(layer.outOpacity||(layer.outMotion??"none")==="fade");
 const duration=mode==="in"?layer.motionDurationMs:(layer.outMotionDurationMs??0);
 const setTransform=(id:MotionPreset)=>patch(mode==="in"?{motion:id}:{outMotion:id,outMotionDurationMs:id==="none"&&!fade?0:(layer.outMotionDurationMs||320)});
 const setFade=()=>patch(mode==="in"?{inOpacity:!fade,motion:layer.motion==="fade"?"none":layer.motion}:{outOpacity:!fade,outMotion:(layer.outMotion??"none")==="fade"?"none":layer.outMotion,outMotionDurationMs:layer.outMotionDurationMs||320});
 const reset=()=>patch(mode==="in"?{motion:"none",inOpacity:false}:{outMotion:"none",outOpacity:false,outMotionDurationMs:0});
 const none=transform==="none"&&!fade;
 return <section className="bm-transition"><header><div><small>{mode.toUpperCase()}</small><h4>Effects</h4></div><span>Duration {Math.round(duration)} ms</span></header>
  <div className="bm-fx-grid">
   <button className={none?"active":""} onClick={reset}><i>•</i><b>None</b></button>
   <button className={fade?"active":""} onClick={setFade}><i>◌</i><b>Fade</b></button>
   {TRANSFORMS.map(p=><button key={p.id} className={transform===p.id?"active":""} onClick={()=>setTransform(p.id)}><i>{p.glyph}</i><b>{p.label}</b></button>)}
  </div>
  <BezierEditor mode={mode} layer={layer} patch={patch}/>
 </section>
}
export default function MotionInspector({layer,patch}:Props){return <div className="bm-motion-inspector"><Transition mode="in" layer={layer} patch={patch}/><Transition mode="out" layer={layer} patch={patch}/></div>}
