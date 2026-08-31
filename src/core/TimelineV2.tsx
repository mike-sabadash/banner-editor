import { ChevronLeft, ChevronRight, Diamond, Pause, Play, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BannerElement } from "../model";
import type { AnimatableProperty } from "../timeline";
import { editorActions, getDisplayElement, useEditorState } from "./editorStore";

const PROPS: AnimatableProperty[] = ["x", "y", "scale", "rotation", "opacity"];
const groupTimes = (frames: { time: number }[]) => [...new Set(frames.map((f) => Number(f.time.toFixed(3))))].sort((a,b)=>a-b);

function NumberField({ element, property }: { element: BannerElement; property: AnimatableProperty }) {
  const state = useEditorState();
  const display = getDisplayElement(element, state.playhead);
  const value = Number(display[property].toFixed(2));
  const [draft, setDraft] = useState(String(value));
  const startRef = useRef<{x:number;value:number}|null>(null);
  useEffect(() => setDraft(String(value)), [value, element.id, property]);
  const commit = (raw: string) => { const n = Number(raw.replace(",",".")); if (Number.isFinite(n)) editorActions.updateElement(element.id, { [property]: n }); };
  const scrub = (event: React.PointerEvent) => {
    event.preventDefault(); startRef.current = { x: event.clientX, value };
    const move = (e: PointerEvent) => { const start=startRef.current;if(!start)return;const speed=property==="opacity"||property==="scale"?.5:.2;const next=start.value+(e.clientX-start.x)*speed*(e.shiftKey?5:1);editorActions.updateElement(element.id,{[property]:property==="opacity"?Math.max(0,Math.min(100,next)):property==="scale"?Math.max(5,Math.min(600,next)):next}); };
    const up=()=>{removeEventListener("pointermove",move);removeEventListener("pointerup",up);startRef.current=null};addEventListener("pointermove",move);addEventListener("pointerup",up);
  };
  const keyed = (state.keyframesByFormat[state.activeFormat]?.[element.id] ?? []).some((f)=>f.property===property&&Math.abs(f.time-state.playhead)<.035);
  return <label className="core-number-row"><span onPointerDown={scrub}>{property}</span><input value={draft} inputMode="decimal" onFocus={(e)=>e.currentTarget.select()} onChange={(e)=>setDraft(e.target.value)} onBlur={()=>commit(draft)} onKeyDown={(e)=>{if(e.key==="Enter"){commit(draft);e.currentTarget.blur()} if(e.key==="ArrowUp"||e.key==="ArrowDown"){e.preventDefault();const step=e.shiftKey?10:1;const next=value+(e.key==="ArrowUp"?step:-step);setDraft(String(next));editorActions.updateElement(element.id,{[property]:next})}}}/><button type="button" className={keyed?"keyed":""} onClick={()=>editorActions.upsertProperties(element.id,{[property]:value})} aria-label={`Key ${property}`}><Diamond size={12} fill={keyed?"currentColor":"none"}/></button></label>;
}

export default function TimelineV2() {
  const state = useEditorState();
  const elements = state.elementsByFormat[state.activeFormat] ?? [];
  const frames = state.keyframesByFormat[state.activeFormat] ?? {};
  const [playing,setPlaying]=useState(false);
  const start=useRef(0);
  useEffect(()=>{if(!playing)return;start.current=performance.now()-state.playhead*1000;let raf=0;const tick=(now:number)=>{const t=(now-start.current)/1000;if(t>=state.duration){editorActions.setPlayhead(state.duration);setPlaying(false);return}editorActions.setPlayhead(t);raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[playing,state.duration]);
  const selected = elements.find((e)=>e.id===state.selectedId)??null;
  const seek=(event:React.PointerEvent<HTMLElement>)=>{const box=event.currentTarget.getBoundingClientRect();editorActions.setPlayhead(((event.clientX-box.left)/box.width)*state.duration)};
  const jump=(id:string,dir:-1|1)=>{const times=groupTimes(frames[id]??[]);const target=dir<0?[...times].reverse().find(t=>t<state.playhead-.02):times.find(t=>t>state.playhead+.02);if(target!==undefined)editorActions.setPlayhead(target)};
  return <section className="core-timeline">
    <header className="core-timeline-toolbar"><button onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><button onClick={()=>{setPlaying(false);editorActions.setPlayhead(0)}}><Square size={13}/></button><b>Timeline</b><span>{state.playhead.toFixed(2)} / {state.duration.toFixed(2)}s</span><div className="core-spacer"/><span className="core-tip">Drag labels to scrub · Enter commits value · Shift = ×5</span></header>
    <div className="core-timeline-grid">
      <div className="core-layer-head">Layers</div><div className="core-ruler" onPointerDown={seek}>{Array.from({length:Math.floor(state.duration)+1},(_,i)=><i key={i} style={{left:`${i/state.duration*100}%`}}><span>{i}s</span></i>)}<div className="core-playhead" style={{left:`${state.playhead/state.duration*100}%`}}/></div>
      {elements.slice().reverse().map((el)=><div className={`core-timeline-row ${el.id===state.selectedId?"active":""}`} key={el.id}><div className="core-layer-cell"><button onClick={()=>jump(el.id,-1)}><ChevronLeft size={14}/></button><button className="core-layer-name" onClick={()=>editorActions.select(el.id)}>{el.name}</button><button className={(frames[el.id]??[]).some(f=>Math.abs(f.time-state.playhead)<.035)?"keyed":""} onClick={()=>editorActions.toggleKeyAtCurrent(el.id)} title="Add/remove keyframe at current time"><Diamond size={12} fill="currentColor"/></button><button onClick={()=>jump(el.id,1)}><ChevronRight size={14}/></button></div><div className="core-track" onPointerDown={(e)=>{editorActions.select(el.id);seek(e)}}><div className="core-track-line"/><div className="core-playhead" style={{left:`${state.playhead/state.duration*100}%`}}/>{groupTimes(frames[el.id]??[]).map((time)=>{const group=(frames[el.id]??[]).filter(f=>Math.abs(f.time-time)<.01);const first=group[0];const active=Math.abs(time-state.playhead)<.025;return <button key={time} className={`core-key ${active?"active":""}`} style={{left:`${time/state.duration*100}%`}} title={`${group.length} properties · ${time.toFixed(2)}s`} onPointerDown={(e)=>{e.stopPropagation();editorActions.selectKey(first.id,el.id)}}/>})}</div></div>)}
    </div>
    {selected&&<aside className="core-inspector"><div className="core-inspector-head"><b>Transform</b><span>{state.playhead>0?"animated":"base"}</span></div>{PROPS.map((p)=><NumberField key={p} element={selected} property={p}/>)}</aside>}
  </section>;
}
