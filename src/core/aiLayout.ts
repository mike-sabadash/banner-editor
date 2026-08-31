import { adaptMasterToFormat, formats, type BannerElement, type Format } from "../model";
import type { AnimatableProperty, FormatKeyframes, Keyframe } from "../timeline";
import { editorActions, getEditorState, type ProjectState } from "./editorStore";

type LayoutPatch = { id: string; x: number; y: number; width: number; scale: number; fontSize: number; visible: boolean };
type LayoutResponse = { rationale: string; elements: LayoutPatch[] };

const roleOf = (element: BannerElement, index: number, total: number) => {
  const hay = `${element.kind} ${element.name} ${element.text}`.toLowerCase();
  if (element.kind === "image" && (element.width >= 80 || /background|bg|фон/.test(hay) || index === 0 && total > 1)) return "background";
  if (/logo|логотип/.test(hay)) return "logo";
  if (/legal|disclaimer|terms|услов|18\+/.test(hay)) return "legal";
  if (/cta|button|кноп|купить|подробнее|узнать|перейти/.test(hay) || element.kind === "button") return "cta";
  if (element.kind === "headline" || /headline|title|заголов/.test(hay)) return "headline";
  if (element.kind === "image") return "image";
  return "text";
};

const serialize = (elements: BannerElement[]) => elements.map((e, index) => ({
  id: e.id,
  role: roleOf(e, index, elements.length),
  kind: e.kind,
  name: e.name,
  text: e.text,
  x: e.x,
  y: e.y,
  width: e.width,
  scale: e.scale,
  fontSize: e.fontSize,
  lineHeight: e.lineHeight,
  visible: e.visible,
}));

const cloneFrameMap = (source: FormatKeyframes): FormatKeyframes => Object.fromEntries(
  Object.entries(source).map(([id, list]) => [id, list.map((f) => ({ ...f, id: crypto.randomUUID(), bezier: f.bezier ? [...f.bezier] as typeof f.bezier : undefined }))]),
);

const remapFrames = (frames: Keyframe[], from: BannerElement, to: BannerElement) => {
  const dx = to.x - from.x, dy = to.y - from.y;
  const scaleRatio = from.scale ? to.scale / from.scale : 1;
  return frames.map((frame) => {
    let value = frame.value;
    if (frame.property === "x") value += dx;
    if (frame.property === "y") value += dy;
    if (frame.property === "scale") value *= scaleRatio;
    return { ...frame, value };
  });
};

const mapAllFrames = (source: FormatKeyframes, fromElements: BannerElement[], toElements: BannerElement[]) => {
  const from = new Map(fromElements.map((e) => [e.id, e])), to = new Map(toElements.map((e) => [e.id, e]));
  return Object.fromEntries(Object.entries(source).map(([id, frames]) => {
    const a = from.get(id), b = to.get(id);
    return [id, a && b ? remapFrames(frames, a, b) : frames.map((f) => ({ ...f }))];
  })) as FormatKeyframes;
};

async function askAi(master: Format, masterElements: BannerElement[], target: Format, baseline: BannerElement[]) {
  const response = await fetch("/api/layout-director", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      master: { width: master.width, height: master.height, elements: serialize(masterElements) },
      target: { id: target.id, width: target.width, height: target.height, elements: serialize(baseline) },
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error || `AI Layout Director failed (${response.status})`);
  return json as LayoutResponse;
}

const applyPatches = (baseline: BannerElement[], patches: LayoutPatch[]) => {
  const map = new Map(patches.map((p) => [p.id, p]));
  return baseline.map((element) => {
    const p = map.get(element.id);
    if (!p) return element;
    return { ...element, x: p.x, y: p.y, width: p.width, scale: p.scale, fontSize: element.kind === "image" ? element.fontSize : p.fontSize, visible: p.visible };
  });
};

async function adaptOne(project: ProjectState, target: Format) {
  const masterFormat = formats.find((f) => f.id === "master")!;
  const masterElements = project.elementsByFormat.master ?? [];
  const masterFrames = project.keyframesByFormat.master ?? {};
  const baseline = adaptMasterToFormat(masterElements, target).elements;
  const clonedMasterFrames = cloneFrameMap(masterFrames);
  const baselineFrames = mapAllFrames(clonedMasterFrames, masterElements, baseline);
  const ai = await askAi(masterFormat, masterElements, target, baseline);
  const improved = applyPatches(baseline, ai.elements);
  const improvedFrames = mapAllFrames(baselineFrames, baseline, improved);
  return { elements: improved, keyframes: improvedFrames, rationale: ai.rationale };
}

export async function aiAdaptFormat(formatId: string) {
  const original = getEditorState();
  if (!(original.elementsByFormat.master ?? []).length) throw new Error("Master is empty");
  const target = formats.find((f) => f.id === formatId);
  if (!target || target.id === "master") throw new Error("Choose a resize format");
  const result = await adaptOne(original, target);
  const next: ProjectState = {
    ...original,
    elementsByFormat: { ...original.elementsByFormat, [target.id]: result.elements },
    keyframesByFormat: { ...original.keyframesByFormat, [target.id]: result.keyframes },
    formatOverrides: { ...original.formatOverrides, [target.id]: false },
  };
  editorActions.importProject(next);
  return result.rationale;
}

export async function aiAdaptAll(onProgress?: (label: string) => void) {
  let project = getEditorState();
  if (!(project.elementsByFormat.master ?? []).length) throw new Error("Master is empty");
  const messages: string[] = [];
  for (const target of formats.filter((f) => f.id !== "master")) {
    onProgress?.(`AI: ${target.label}…`);
    try {
      const result = await adaptOne(project, target);
      project = {
        ...project,
        elementsByFormat: { ...project.elementsByFormat, [target.id]: result.elements },
        keyframesByFormat: { ...project.keyframesByFormat, [target.id]: result.keyframes },
        formatOverrides: { ...project.formatOverrides, [target.id]: false },
      };
      messages.push(`${target.label}: ${result.rationale}`);
    } catch (error) {
      const master = project.elementsByFormat.master ?? [];
      const baseline = adaptMasterToFormat(master, target).elements;
      const cloned = cloneFrameMap(project.keyframesByFormat.master ?? {});
      project = {
        ...project,
        elementsByFormat: { ...project.elementsByFormat, [target.id]: baseline },
        keyframesByFormat: { ...project.keyframesByFormat, [target.id]: mapAllFrames(cloned, master, baseline) },
        formatOverrides: { ...project.formatOverrides, [target.id]: false },
      };
      messages.push(`${target.label}: fallback (${error instanceof Error ? error.message : "AI failed"})`);
    }
  }
  editorActions.importProject(project);
  onProgress?.("AI adaptation complete");
  return messages;
}
