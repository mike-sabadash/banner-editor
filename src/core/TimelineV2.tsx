import { ChevronLeft, ChevronRight, Diamond, Pause, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BannerElement } from "../model";
import type { AnimatableProperty } from "../timeline";
import { rulerTicks, snapTimelineTime } from "./interaction";
import { editorActions, getDisplayElement, useEditorState } from "./editorStore";

const PROPS: AnimatableProperty[] = ["x", "y", "scale", "rotation", "opacity"];
const groupTimes = (frames: { time: number }[]) => [...new Set(frames.map((frame) => Number(frame.time.toFixed(3))))].sort((a, b) => a - b);

function NumberField({ element, property }: { element: BannerElement; property: AnimatableProperty }) {
  const state = useEditorState(), display = getDisplayElement(element, state.playhead), value = Number(display[property].toFixed(2));
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value, element.id, property]);
  const commit = (raw: string) => { const number = Number(raw.replace(",", ".")); if (Number.isFinite(number)) editorActions.updateElement(element.id, { [property]: number }); };
  const scrub = (event: React.PointerEvent) => {
    event.preventDefault();
    const startX = event.clientX, start = value;
    const move = (nextEvent: PointerEvent) => {
      const speed = property === "opacity" || property === "scale" ? .5 : .2;
      let next = start + (nextEvent.clientX - startX) * speed * (nextEvent.shiftKey ? 5 : 1);
      if (property === "opacity") next = Math.max(0, Math.min(100, next));
      if (property === "scale") next = Math.max(5, Math.min(600, next));
      editorActions.updateElement(element.id, { [property]: next });
    };
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  };
  const keyed = (state.keyframesByFormat[state.activeFormat]?.[element.id] ?? []).some((frame) => frame.property === property && Math.abs(frame.time - state.playhead) < .035);
  return <label className="core-number-row"><span onPointerDown={scrub}>{property}</span><input value={draft} inputMode="decimal" onFocus={(event) => event.currentTarget.select()} onChange={(event) => setDraft(event.target.value)} onBlur={() => commit(draft)} onKeyDown={(event) => { if (event.key === "Enter") { commit(draft); event.currentTarget.blur(); } if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); const step = event.shiftKey ? 10 : 1, next = value + (event.key === "ArrowUp" ? step : -step); setDraft(String(next)); editorActions.updateElement(element.id, { [property]: next }); } }} /><button type="button" className={keyed ? "keyed" : ""} onClick={() => editorActions.upsertProperties(element.id, { [property]: value })} aria-label={`Key ${property}`}><Diamond size={12} fill={keyed ? "currentColor" : "none"} /></button></label>;
}

export function TransformInspector({ element }: { element: BannerElement }) {
  const state = useEditorState(), frames = state.keyframesByFormat[state.activeFormat] ?? {};
  return <section className="core-transform-panel"><div className="core-inspector-head"><b>Transform</b><span>{(frames[element.id] ?? []).some((frame) => Math.abs(frame.time - state.playhead) < .035) ? "KEYFRAME" : state.playhead > 0 ? "ANIMATED" : "BASE"}</span></div>{PROPS.map((property) => <NumberField key={property} element={element} property={property} />)}</section>;
}

export default function TimelineV2() {
  const state = useEditorState(), elements = state.elementsByFormat[state.activeFormat] ?? [], frames = state.keyframesByFormat[state.activeFormat] ?? {};
  const [playing, setPlaying] = useState(false), start = useRef(0);
  useEffect(() => {
    if (!playing) return;
    start.current = performance.now() - state.playhead * 1000;
    let frame = 0;
    const tick = (now: number) => {
      const time = (now - start.current) / 1000;
      if (time >= state.duration) { editorActions.setPlayhead(state.duration); setPlaying(false); return; }
      editorActions.setPlayhead(time, true);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, state.duration]);

  const seekAt = (node: HTMLElement, x: number) => {
    const box = node.getBoundingClientRect();
    const raw = ((x - box.left) / box.width) * state.duration;
    editorActions.setPlayhead(snapTimelineTime(raw, state.duration, box.width));
  };
  const scrubTimeline = (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    setPlaying(false);
    const node = event.currentTarget;
    seekAt(node, event.clientX);
    const move = (nextEvent: PointerEvent) => seekAt(node, nextEvent.clientX);
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  };
  const jump = (id: string, direction: -1 | 1) => {
    const times = groupTimes(frames[id] ?? []);
    const target = direction < 0 ? [...times].reverse().find((time) => time < state.playhead - .02) : times.find((time) => time > state.playhead + .02);
    if (target !== undefined) editorActions.setPlayhead(target);
  };
  const dragGroup = (event: React.PointerEvent<HTMLButtonElement>, elementId: string, time: number, firstId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setPlaying(false);
    editorActions.selectKey(firstId, elementId);
    const track = event.currentTarget.parentElement as HTMLElement;
    const startX = event.clientX, box = track.getBoundingClientRect();
    const otherTimes = Object.values(frames).flat().map((frame) => frame.time).filter((value) => Math.abs(value - time) > .035);
    const move = (nextEvent: PointerEvent) => {
      const raw = time + ((nextEvent.clientX - startX) / box.width) * state.duration;
      const next = snapTimelineTime(raw, state.duration, box.width, [state.playhead, ...otherTimes]);
      editorActions.moveKeyframeGroup(elementId, time, next);
    };
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
    addEventListener("pointermove", move);
    addEventListener("pointerup", up);
  };
  const ticks = rulerTicks(state.duration);

  return <section className="core-timeline"><header className="core-timeline-toolbar"><button onClick={() => setPlaying((value) => !value)}>{playing ? <Pause size={15} /> : <Play size={15} />}</button><button onClick={() => { setPlaying(false); editorActions.setPlayhead(0); }}><Square size={13} /></button><b>Timeline</b><span>{state.playhead.toFixed(2)} / {state.duration.toFixed(2)}s</span><div className="core-spacer" /><span className="core-tip">Snaps to 30 fps · magnetic quarter-second grid</span></header><div className="core-timeline-grid"><div className="core-layer-head">Layers</div><div className="core-ruler" onPointerDown={scrubTimeline}>{ticks.map((tick) => <i key={tick.time} className={tick.kind} style={{ left: `${tick.time / state.duration * 100}%` }}>{tick.kind === "major" && <span>{tick.time}s</span>}</i>)}<div className="core-playhead" style={{ left: `${state.playhead / state.duration * 100}%` }} /></div>{elements.slice().reverse().map((element) => <div className={`core-timeline-row ${element.id === state.selectedId ? "active" : ""}`} key={element.id}><div className="core-layer-cell"><button onClick={() => jump(element.id, -1)}><ChevronLeft size={14} /></button><button className="core-layer-name" onClick={() => editorActions.select(element.id)}>{element.name}</button><button className={(frames[element.id] ?? []).some((frame) => Math.abs(frame.time - state.playhead) < .035) ? "keyed" : ""} onClick={() => editorActions.toggleKeyAtCurrent(element.id)} title="Add/remove keyframe at current time"><Diamond size={12} fill="currentColor" /></button><button onClick={() => jump(element.id, 1)}><ChevronRight size={14} /></button></div><div className="core-track" onPointerDown={(event) => { editorActions.select(element.id); scrubTimeline(event); }}><div className="core-track-line" /><div className="core-playhead" style={{ left: `${state.playhead / state.duration * 100}%` }} />{groupTimes(frames[element.id] ?? []).map((time) => { const group = (frames[element.id] ?? []).filter((frame) => Math.abs(frame.time - time) < .01), first = group[0], active = Math.abs(time - state.playhead) < .025; return <button key={time} className={`core-key ${active ? "active" : ""}`} style={{ left: `${time / state.duration * 100}%` }} title={`${group.length} properties · ${time.toFixed(2)}s`} onPointerDown={(event) => dragGroup(event, element.id, time, first.id)} />; })}</div></div>)}</div></section>;
}
