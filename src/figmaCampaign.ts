import { createTextElement, formats, type BannerElement } from "./model";
import type { ProjectState } from "./core/editorStore";
import type { AnimatableProperty, FormatKeyframes, Keyframe } from "./timeline";

export type FigmaMotionKey = {
  time: number;
  value: number;
  easing?: string;
  bezier?: [number, number, number, number];
};
export type FigmaCampaignLayer = {
  id: string;
  slotId?: string;
  name: string;
  type: "TEXT" | "IMAGE" | "SHAPE";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  assetUrl?: string;
  motion?: Partial<Record<AnimatableProperty, FigmaMotionKey[]>>;
};
export type FigmaCampaignFormat = {
  id: string;
  name: string;
  width: number;
  height: number;
  duration: number;
  background?: string;
  layers: FigmaCampaignLayer[];
};
export type FigmaCampaignDocument = {
  schema: "banner-campaign/figma-v1";
  campaign: { id: string; name: string };
  formats: FigmaCampaignFormat[];
};

const formatId = (source: FigmaCampaignFormat) =>
  formats.find(
    (format) =>
      format.width === source.width && format.height === source.height,
  )?.id;
const percent = (value: number, total: number) =>
  total ? (value / total) * 100 : 0;
const easing = (value?: string) =>
  value === "LINEAR"
    ? "linear"
    : value === "EASE_IN"
      ? "inCubic"
      : value === "EASE_OUT"
        ? "outCubic"
        : value === "CUSTOM_CUBIC_BEZIER"
          ? "custom"
          : "inOutCubic";

export function isFigmaCampaign(
  value: unknown,
): value is FigmaCampaignDocument {
  return Boolean(
    value &&
    typeof value === "object" &&
    (value as { schema?: string }).schema === "banner-campaign/figma-v1",
  );
}

export function figmaCampaignToProject(
  source: FigmaCampaignDocument,
  base: ProjectState,
): ProjectState {
  const elementsByFormat = { ...base.elementsByFormat },
    keyframesByFormat = { ...base.keyframesByFormat },
    backgrounds = { ...base.backgrounds },
    overrides = { ...base.formatOverrides };
  let duration = 0.1;
  for (const artboard of source.formats) {
    const id = formatId(artboard);
    if (!id) continue;
    duration = Math.max(duration, artboard.duration || 0.1);
    backgrounds[id] = { color: artboard.background ?? "#ffffff" };
    overrides[id] = true;
    const frames: FormatKeyframes = {};
    elementsByFormat[id] = artboard.layers.map((layer, index) => {
      const stable = layer.slotId || layer.id;
      const elementId = `figma:${stable}`;
      const element: BannerElement = {
        ...createTextElement(),
        id: elementId,
        kind: layer.type === "IMAGE" ? "image" : "headline",
        name: layer.name,
        text: layer.text ?? "",
        assetUrl: layer.assetUrl,
        x: percent(layer.x, artboard.width),
        y: percent(layer.y, artboard.height),
        width: percent(layer.width, artboard.width),
        scale: 100,
        rotation: layer.rotation ?? 0,
        opacity: Math.round((layer.opacity ?? 1) * 100),
        fontFamily: layer.fontFamily ?? "Inter",
        fontSize: layer.fontSize ?? 16,
        lineHeight: 110,
        color: layer.color ?? "#171812",
        inPoint: 0,
        outPoint: artboard.duration,
        locked: false,
        visible: layer.visible !== false,
        contentLinked: Boolean(layer.slotId),
      };
      const list: Keyframe[] = [];
      for (const [property, keys] of Object.entries(layer.motion ?? {}) as [
        AnimatableProperty,
        FigmaMotionKey[],
      ][]) {
        for (const key of keys)
          list.push({
            id: `figma-key:${id}:${stable}:${property}:${key.time}:${index}`,
            time: key.time,
            property,
            value: key.value,
            easing: easing(key.easing),
            bezier: key.bezier,
          });
      }
      if (list.length) frames[elementId] = list.sort((a, b) => a.time - b.time);
      return element;
    });
    keyframesByFormat[id] = frames;
  }
  return {
    ...base,
    title: source.campaign.name,
    duration,
    elementsByFormat,
    keyframesByFormat,
    backgrounds,
    formatOverrides: overrides,
    activeFormat: formatId(source.formats[0]) ?? "master",
    selectedId: null,
    selectedIds: [],
    selectedKeyframeId: null,
    selectedKeyframeIds: [],
    playhead: 0,
  };
}
