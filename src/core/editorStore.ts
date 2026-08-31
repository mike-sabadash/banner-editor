import { useSyncExternalStore } from "react";
import { createTextElement, defaultBannerSettings, formats, type BannerElement, type BannerSettings } from "../model";
import { interpolateValue, type AnimatableProperty, type Bezier, type Easing, type FormatKeyframes, type Keyframe } from "../timeline";

export type ProjectState = {
  version: 2;
  title: string;
  duration: number;
  activeFormat: string;
  elementsByFormat: Record<string, BannerElement[]>;
  keyframesByFormat: Record<string, FormatKeyframes>;
  backgrounds: Record<string, { color: string }>;
  settings: BannerSettings;
  selectedId: string | null;
  selectedKeyframeId: string | null;
  playhead: number;
};

const STORAGE_KEY = "banner-editor:core-v2";
const blankElements = () => Object.fromEntries(formats.map((f) => [f.id, [] as BannerElement[]]));
const blankFrames = () => Object.fromEntries(formats.map((f) => [f.id, {} as FormatKeyframes]));
const blankBackgrounds = () => Object.fromEntries(formats.map((f) => [f.id, { color: "#ffffff" }]));
const fresh = (): ProjectState => ({ version: 2, title: "Untitled campaign", duration: 6, activeFormat: "master", elementsByFormat: blankElements(), keyframesByFormat: blankFrames(), backgrounds: blankBackgrounds(), settings: { ...defaultBannerSettings }, selectedId: null, selectedKeyframeId: null, playhead: 0 });
const load = (): ProjectState => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh(); } catch { return fresh(); } };
let state = load();
const listeners = new Set<() => void>();
const emit = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} listeners.forEach((l) => l()); };
const patch = (next: Partial<ProjectState> | ((s: ProjectState) => Partial<ProjectState>)) => { state = { ...state, ...(typeof next === "function" ? next(state) : next) }; emit(); };
const subscribe = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
export const useEditorState = () => useSyncExternalStore(subscribe, () => state, () => state);
export const getEditorState = () => state;

const elementList = (s = state) => s.elementsByFormat[s.activeFormat] ?? [];
const frameMap = (s = state) => s.keyframesByFormat[s.activeFormat] ?? {};
const selected = (s = state) => elementList(s).find((e) => e.id === s.selectedId) ?? null;
const currentValue = (e: BannerElement, p: AnimatableProperty, time = state.playhead) => interpolateValue(e[p], frameMap()[e.id] ?? [], p, time);

export const editorActions = {
  setPlayhead(time: number) { patch({ playhead: Math.max(0, Math.min(state.duration, time)), selectedKeyframeId: null }); },
  select(id: string | null) { patch({ selectedId: id, selectedKeyframeId: null }); },
  setFormat(id: string) { patch({ activeFormat: id, selectedId: null, selectedKeyframeId: null, playhead: 0 }); },
  addText() { const el = createTextElement(); patch((s) => ({ elementsByFormat: { ...s.elementsByFormat, [s.activeFormat]: [...elementList(s), el] }, selectedId: el.id })); },
  addImage(name: string, url: string) { const el: BannerElement = { id: crypto.randomUUID(), kind: "image", name, text: "", assetUrl: url, x: 25, y: 25, width: 40, scale: 100, rotation: 0, opacity: 100, fontFamily: "Arial", fontSize: 16, lineHeight: 100, color: "#000000", locked: false, visible: true }; patch((s) => ({ elementsByFormat: { ...s.elementsByFormat, [s.activeFormat]: [...elementList(s), el] }, selectedId: el.id })); },
  updateElement(id: string, values: Partial<BannerElement>, keyed = true) { const target = elementList().find((e) => e.id === id); if (!target) return; const anim = Object.entries(values).filter(([k]) => ["x","y","scale","rotation","opacity"].includes(k)) as [AnimatableProperty, number][]; const stat = Object.fromEntries(Object.entries(values).filter(([k]) => !["x","y","scale","rotation","opacity"].includes(k))) as Partial<BannerElement>;
    if (Object.keys(stat).length || !keyed || state.playhead <= .001) patch((s) => ({ elementsByFormat: { ...s.elementsByFormat, [s.activeFormat]: elementList(s).map((e) => e.id === id ? { ...e, ...stat, ...(!keyed || s.playhead <= .001 ? Object.fromEntries(anim) : {}) } : e) } }));
    if (keyed && state.playhead > .001 && anim.length) this.upsertProperties(id, Object.fromEntries(anim));
  },
  upsertProperties(id: string, values: Partial<Record<AnimatableProperty, number>>, easing: Easing = "ease-in-out", bezier: Bezier = [.42,0,.58,1]) { patch((s) => { let list = [...(frameMap(s)[id] ?? [])]; for (const [property, value] of Object.entries(values) as [AnimatableProperty, number][]) { const existing = list.find((f) => f.property === property && Math.abs(f.time - s.playhead) < .035); const frame: Keyframe = { id: existing?.id ?? crypto.randomUUID(), time: s.playhead, property, value, easing: existing?.easing ?? easing, bezier: existing?.bezier ?? bezier }; list = [...list.filter((f) => f.id !== frame.id), frame].sort((a,b)=>a.time-b.time); } return { keyframesByFormat: { ...s.keyframesByFormat, [s.activeFormat]: { ...frameMap(s), [id]: list } } }; }); },
  toggleKeyAtCurrent(id: string) { const target = elementList().find((e) => e.id === id); if (!target) return; const at = (frameMap()[id] ?? []).filter((f) => Math.abs(f.time - state.playhead) < .035); if (at.length) { patch((s) => ({ keyframesByFormat: { ...s.keyframesByFormat, [s.activeFormat]: { ...frameMap(s), [id]: (frameMap(s)[id] ?? []).filter((f) => Math.abs(f.time - s.playhead) >= .035) } }, selectedKeyframeId: null })); return; } const values = Object.fromEntries((["x","y","scale","rotation","opacity"] as AnimatableProperty[]).map((p) => [p, currentValue(target,p)])); this.upsertProperties(id, values); },
  selectKey(id: string, elementId: string) { const frame = (frameMap()[elementId] ?? []).find((f) => f.id === id); if (frame) patch({ selectedId: elementId, selectedKeyframeId: id, playhead: frame.time }); },
  moveKeyframe(elementId: string, keyframeId: string, time: number) { patch((s) => ({ keyframesByFormat: { ...s.keyframesByFormat, [s.activeFormat]: { ...frameMap(s), [elementId]: (frameMap(s)[elementId] ?? []).map((f) => f.id === keyframeId ? { ...f, time: Math.max(0, Math.min(s.duration,time)) } : f).sort((a,b)=>a.time-b.time) } }, playhead: Math.max(0, Math.min(s.duration,time)), selectedKeyframeId: keyframeId })); },
  deleteSelectedKeyframe() { if (!state.selectedId || !state.selectedKeyframeId) return; const id = state.selectedId, key = state.selectedKeyframeId; patch((s) => ({ keyframesByFormat: { ...s.keyframesByFormat, [s.activeFormat]: { ...frameMap(s), [id]: (frameMap(s)[id] ?? []).filter((f)=>f.id!==key) } }, selectedKeyframeId: null })); },
  setSelectedKeyEasing(easing: Easing, bezier: Bezier) { if (!state.selectedId || !state.selectedKeyframeId) return; const id=state.selectedId,key=state.selectedKeyframeId; patch((s)=>({ keyframesByFormat:{...s.keyframesByFormat,[s.activeFormat]:{...frameMap(s),[id]:(frameMap(s)[id]??[]).map((f)=>f.id===key?{...f,easing,bezier:[...bezier] as Bezier}:f)}}})); },
  removeSelected() { if (!state.selectedId) return; const id=state.selectedId; patch((s)=>({elementsByFormat:{...s.elementsByFormat,[s.activeFormat]:elementList(s).filter((e)=>e.id!==id)},keyframesByFormat:{...s.keyframesByFormat,[s.activeFormat]:Object.fromEntries(Object.entries(frameMap(s)).filter(([k])=>k!==id))},selectedId:null,selectedKeyframeId:null})); },
  newProject() { state = fresh(); emit(); },
  importProject(project: ProjectState) { state = { ...fresh(), ...project, version: 2 }; emit(); },
  exportProject() { return JSON.stringify(state, null, 2); },
};

export const getDisplayElement = (element: BannerElement, time = state.playhead): BannerElement => ({ ...element, x: currentValue(element,"x",time), y: currentValue(element,"y",time), scale: currentValue(element,"scale",time), rotation: currentValue(element,"rotation",time), opacity: currentValue(element,"opacity",time) });
