import { adaptMasterToFormat, formats, type AssetLibraryItem, type BannerElement, type Format } from "../model";
import type { FormatKeyframes, Keyframe } from "../timeline";
import { editorActions, getEditorState, type ProjectState } from "./editorStore";
import { selectAssetCandidates } from "./assetSelection";

type LayoutPatch = { id: string; x: number; y: number; width: number; scale: number; fontSize: number; visible: boolean; assetId?: string };
type LayoutResponse = { rationale: string; elements: LayoutPatch[]; model?: string; provider?: string; usage?: {prompt_tokens?:number;completion_tokens?:number} };
type LayoutRole = "background" | "logo" | "headline" | "text" | "cta" | "legal" | "image" | "icon" | "ui";

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (src: string) => {
  if (!imageCache.has(src)) imageCache.set(src, new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not render an image asset for AI preview"));
    img.src = src;
  }));
  return imageCache.get(src)!;
};

const roleOf = (element: BannerElement, index: number, total: number): LayoutRole => {
  const hay = `${element.kind} ${element.name} ${element.text}`.toLowerCase();
  if (/logo|логотип/.test(hay) && element.kind === "image") return "logo";
  if (/ui|interface|screen|widget|panel|card|mobile|onboard|404/.test(hay) && element.kind === "image") return "ui";
  if (/icon|shield|badge|икон/.test(hay) && element.kind === "image") return "icon";
  if (element.kind === "image" && (/background|\bbg\b|фон|1200x628/.test(hay) || element.width >= 88 || (index === 0 && total > 1 && element.width >= 70))) return "background";
  if (/legal|disclaimer|terms|услов|18\+/.test(hay) || element.kind === "legal") return "legal";
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const output: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { output.push(""); continue; }
    let line = words[0];
    for (const word of words.slice(1)) {
      const test = `${line} ${word}`;
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else { output.push(line); line = word; }
    }
    output.push(line);
  }
  return output;
}

async function renderPreview(format: Format, elements: BannerElement[], background = "#ffffff") {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const maxEdge = 680;
    const previewScale = Math.min(1, maxEdge / Math.max(format.width, format.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(format.width * previewScale));
    canvas.height = Math.max(1, Math.round(format.height * previewScale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.scale(previewScale, previewScale);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, format.width, format.height);

    for (const element of elements) {
      if (!element.visible) continue;
      const x = element.x / 100 * format.width;
      const y = element.y / 100 * format.height;
      const width = element.width / 100 * format.width;
      const objectScale = element.scale / 100;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(element.rotation * Math.PI / 180);
      ctx.scale(objectScale, objectScale);
      ctx.globalAlpha = element.opacity / 100;

      if (element.kind === "image" && element.assetUrl) {
        try {
          const img = await loadImage(element.assetUrl);
          const ratio = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0.65;
          ctx.drawImage(img, 0, 0, width, width * ratio);
        } catch { }
      } else if (element.kind !== "image") {
        const weight = element.kind === "headline" ? 700 : 500;
        ctx.font = `${weight} ${Math.max(1, element.fontSize)}px ${element.fontFamily || "Arial"}`;
        ctx.fillStyle = element.color || "#111111";
        ctx.textBaseline = "top";
        const lineHeight = element.fontSize * element.lineHeight / 100;
        const lines = wrapText(ctx, element.text || "", Math.max(1, width));
        lines.forEach((line, lineIndex) => ctx.fillText(line, 0, lineIndex * lineHeight, width));
      }
      ctx.restore();
    }
    return canvas.toDataURL("image/jpeg", 0.76);
  } catch {
    return undefined;
  }
}

async function renderAssetPreview(asset: AssetLibraryItem) {
  try {
    const image = await loadImage(asset.assetUrl);
    const maxEdge = 420;
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return undefined;
  }
}

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

async function askAi(master: Format, masterElements: BannerElement[], target: Format, baseline: BannerElement[], assets: AssetLibraryItem[], masterBackground: string, targetBackground: string, signal?: AbortSignal) {
  const [masterPreview, targetPreview, assetPreviews] = await Promise.all([
    renderPreview(master, masterElements, masterBackground),
    renderPreview(target, baseline, targetBackground),
    Promise.all(assets.map(async (asset) => ({ ...asset, previewDataUrl: await renderAssetPreview(asset) }))),
  ]);
  const response = await fetch("/api/layout-director", {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      master: { width: master.width, height: master.height, elements: serialize(masterElements), previewDataUrl: masterPreview },
      target: { id: target.id, width: target.width, height: target.height, elements: serialize(baseline), previewDataUrl: targetPreview },
      assets: assetPreviews.map(({ assetUrl: _assetUrl, ...asset }) => asset),
    }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json?.error || `AI Layout Director failed (${response.status})`);
  return json as LayoutResponse;
}

const applyPatches = (baseline: BannerElement[], patches: LayoutPatch[], assets: AssetLibraryItem[]) => {
  const map = new Map(patches.map((p) => [p.id, p]));
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  return baseline.map((element, index) => {
    const patch = map.get(element.id);
    if (!patch) return element;
    const role = roleOf(element, index, baseline.length);
    const isText = element.kind !== "image";
    const replacement = !isText && patch.assetId ? assetMap.get(patch.assetId) : undefined;
    return {
      ...element,
      ...(replacement ? { name: replacement.name, assetUrl: replacement.assetUrl } : {}),
      x: patch.x,
      y: patch.y,
      width: patch.width,
      scale: isText ? 100 : role === "background" ? patch.scale : 100,
      fontSize: isText ? patch.fontSize : element.fontSize,
      visible: patch.visible,
    };
  });
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function repairComposition(target: Format, elements: BannerElement[]) {
  const ratio = target.width / target.height;
  const portrait = ratio < 0.8;
  const strip = ratio >= 4;
  const extremeStrip = ratio >= 6;
  const roles = new Map(elements.map((element, index) => [element.id, roleOf(element, index, elements.length)]));

  return elements.map((source) => {
    const role = roles.get(source.id)!;
    const element = { ...source };

    if (role !== "background") element.scale = 100;
    if (element.kind !== "image") {
      element.scale = 100;
      element.width = clamp(element.width, 10, 90);
    }

    if (role === "background") return element;

    if (portrait) {
      if (role === "logo") Object.assign(element, { x: 8, y: 6, width: 16, scale: 100 });
      else if (role === "headline") Object.assign(element, { x: 8, y: 18, width: 84, fontSize: clamp(element.fontSize, 28, 34), scale: 100 });
      else if (role === "text") Object.assign(element, { x: 14, y: 46, width: 72, fontSize: clamp(element.fontSize, 17, 21), scale: 100 });
      else if (role === "icon") Object.assign(element, { x: 8, y: 47, width: 6, scale: 100 });
      else if (role === "ui") Object.assign(element, { x: 10, y: 72, width: 80, scale: 100 });
      else if (role === "cta") Object.assign(element, { x: 10, y: 64, width: 80, scale: 100 });
      else if (role === "legal") Object.assign(element, { x: 8, y: 92, width: 84, fontSize: clamp(element.fontSize, 8, 12), scale: 100 });
      else Object.assign(element, { x: clamp(element.x, 8, 82), y: clamp(element.y, 8, 88), width: clamp(element.width, 18, 84) });
      return element;
    }

    if (strip) {
      if (extremeStrip) {
        if (role === "logo") Object.assign(element, { x: 2, y: 14, width: 9, scale: 100 });
        else if (role === "headline") Object.assign(element, { x: 14, y: 9, width: 34, fontSize: clamp(element.fontSize, 10, 13), scale: 100 });
        else if (role === "text") Object.assign(element, { x: 14, y: 58, width: 34, fontSize: clamp(element.fontSize, 6, 8), scale: 100 });
        else if (role === "icon") Object.assign(element, { x: 11, y: 57, width: 2.5, scale: 100 });
        else if (role === "ui") Object.assign(element, { x: 66, y: 9, width: 31, scale: 100 });
      } else {
        if (role === "logo") Object.assign(element, { x: 3, y: 12, width: 9, scale: 100 });
        else if (role === "headline") Object.assign(element, { x: 16, y: 10, width: 37, fontSize: clamp(element.fontSize, 19, 24), scale: 100 });
        else if (role === "text") Object.assign(element, { x: 16, y: 58, width: 36, fontSize: clamp(element.fontSize, 9, 12), scale: 100 });
        else if (role === "icon") Object.assign(element, { x: 13, y: 57, width: 2.8, scale: 100 });
        else if (role === "ui") Object.assign(element, { x: 66, y: 10, width: 30, scale: 100 });
      }
      return element;
    }

    if (role === "logo") Object.assign(element, { width: clamp(element.width, 10, 18), scale: 100 });
    if (role === "headline") Object.assign(element, { fontSize: clamp(element.fontSize, 22, 31), scale: 100, width: clamp(element.width, 42, 78) });
    if (role === "text") Object.assign(element, { fontSize: clamp(element.fontSize, 12, 18), scale: 100, width: clamp(element.width, 34, 74) });
    if (role === "icon") Object.assign(element, { width: clamp(element.width, 4, 9), scale: 100 });
    if (role === "ui") Object.assign(element, { width: clamp(element.width, 54, 82), scale: 100 });
    element.x = clamp(element.x, 4, 92);
    element.y = clamp(element.y, 4, 92);
    return element;
  });
}

async function adaptOne(project: ProjectState, target: Format, signal?: AbortSignal) {
  const masterFormat = formats.find((f) => f.id === "master")!;
  const masterElements = project.elementsByFormat.master ?? [];
  const masterFrames = project.keyframesByFormat.master ?? {};
  const baseline = adaptMasterToFormat(masterElements, target).elements;
  const clonedMasterFrames = cloneFrameMap(masterFrames);
  const baselineFrames = mapAllFrames(clonedMasterFrames, masterElements, baseline);
  const assets = selectAssetCandidates(project.assets ?? [], target);
  const ai = await askAi(masterFormat, masterElements, target, baseline, assets, project.backgrounds.master?.color ?? "#ffffff", project.backgrounds[target.id]?.color ?? "#ffffff", signal);
  const aiLayout = applyPatches(baseline, ai.elements, assets);
  const improved = repairComposition(target, aiLayout);
  const improvedFrames = mapAllFrames(baselineFrames, baseline, improved);
  return { elements: improved, keyframes: improvedFrames, rationale: ai.rationale, model: ai.model, provider: ai.provider };
}

export async function aiAdaptFormat(formatId: string, signal?: AbortSignal) {
  const original = getEditorState();
  if (!(original.elementsByFormat.master ?? []).length) throw new Error("Master is empty");
  const target = formats.find((f) => f.id === formatId);
  if (!target || target.id === "master") throw new Error("Choose a resize format");
  const result = await adaptOne(original, target, signal);
  const next: ProjectState = {
    ...original,
    elementsByFormat: { ...original.elementsByFormat, [target.id]: result.elements },
    keyframesByFormat: { ...original.keyframesByFormat, [target.id]: result.keyframes },
    formatOverrides: { ...original.formatOverrides, [target.id]: false },
  };
  editorActions.importProject(next);
  return `${result.model?`${result.model} · `:""}${result.rationale}`;
}

export type AiFormatStatus = "running" | "ready" | "fallback";

export async function aiAdaptAll(
  onProgress?: (label: string) => void,
  onFormatStatus?: (formatId: string, status: AiFormatStatus) => void,
  signal?: AbortSignal,
) {
  let project = getEditorState();
  if (!(project.elementsByFormat.master ?? []).length) throw new Error("Master is empty");
  const targets = formats.filter((format) => format.id !== "master");
  const messages: string[] = [];
  const failures: string[] = [];

  for (const [index, target] of targets.entries()) {
    if (signal?.aborted) throw new DOMException("AI adaptation cancelled", "AbortError");
    onFormatStatus?.(target.id, "running");
    onProgress?.(`AI ${index + 1}/${targets.length}: ${target.label}…`);

    try {
      const result = await adaptOne(project, target, signal);
      project = {
        ...project,
        elementsByFormat: { ...project.elementsByFormat, [target.id]: result.elements },
        keyframesByFormat: { ...project.keyframesByFormat, [target.id]: result.keyframes },
        formatOverrides: { ...project.formatOverrides, [target.id]: false },
      };
      messages.push(`${target.label}: ${result.model?`[${result.model}] `:""}${result.rationale}`);
      onFormatStatus?.(target.id, "ready");
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) throw error;
      const reason = error instanceof Error ? error.message : "AI failed";
      const master = project.elementsByFormat.master ?? [];
      const baseline = adaptMasterToFormat(master, target).elements;
      const repaired = repairComposition(target, baseline);
      const cloned = cloneFrameMap(project.keyframesByFormat.master ?? {});
      project = {
        ...project,
        elementsByFormat: { ...project.elementsByFormat, [target.id]: repaired },
        keyframesByFormat: { ...project.keyframesByFormat, [target.id]: mapAllFrames(cloned, master, repaired) },
        formatOverrides: { ...project.formatOverrides, [target.id]: false },
      };
      failures.push(`${target.label}: ${reason}`);
      messages.push(`${target.label}: FALLBACK — ${reason}`);
      onFormatStatus?.(target.id, "fallback");
    }

    const live = getEditorState();
    editorActions.importProject({
      ...live,
      elementsByFormat: project.elementsByFormat,
      keyframesByFormat: project.keyframesByFormat,
      formatOverrides: project.formatOverrides,
    });
  }

  if (failures.length) {
    onProgress?.(`Completed with ${failures.length} fallback format(s)`);
    throw new Error(`AI did not complete ${failures.length} format(s). Repaired fallback applied. ${failures[0]}`);
  }
  onProgress?.("Vision AI adaptation complete");
  return messages;
}
