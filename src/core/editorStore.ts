import { useSyncExternalStore } from "react";
import {
  adaptMasterToFormat,
  createTextElement,
  defaultBannerSettings,
  formats,
  type AssetLibraryItem,
  type BannerElement,
  type BannerSettings,
} from "../model";
import {
  interpolateValue,
  type AnimatableProperty,
  type Bezier,
  type Easing,
  type FormatKeyframes,
  type Keyframe,
} from "../timeline";

export type ProjectState = {
  version: 2;
  title: string;
  duration: number;
  activeFormat: string;
  elementsByFormat: Record<string, BannerElement[]>;
  keyframesByFormat: Record<string, FormatKeyframes>;
  backgrounds: Record<string, { color: string }>;
  assets: AssetLibraryItem[];
  settings: BannerSettings;
  formatOverrides: Record<string, boolean>;
  selectedId: string | null;
  selectedIds: string[];
  selectedKeyframeId: string | null;
  selectedKeyframeIds: string[];
  playhead: number;
  canvasZoom: number;
  timelineHeight: number;
  frameRate: number;
  snapEnabled: boolean;
};
export type FormatScope = "format" | "family" | "campaign";

const STORAGE_KEY = "banner-editor:core-v2";
const blankElements = () =>
  Object.fromEntries(formats.map((f) => [f.id, [] as BannerElement[]]));
const blankFrames = () =>
  Object.fromEntries(formats.map((f) => [f.id, {} as FormatKeyframes]));
const blankBackgrounds = () =>
  Object.fromEntries(formats.map((f) => [f.id, { color: "#ffffff" }]));
const blankOverrides = () =>
  Object.fromEntries(formats.map((f) => [f.id, false]));
const fresh = (): ProjectState => ({
  version: 2,
  title: "Untitled campaign",
  duration: 6,
  activeFormat: "master",
  elementsByFormat: blankElements(),
  keyframesByFormat: blankFrames(),
  backgrounds: blankBackgrounds(),
  assets: [],
  settings: { ...defaultBannerSettings },
  formatOverrides: blankOverrides(),
  selectedId: null,
  selectedIds: [],
  selectedKeyframeId: null,
  selectedKeyframeIds: [],
  playhead: 0,
  canvasZoom: 1,
  timelineHeight: 232,
  frameRate: 30,
  snapEnabled: true,
});
const load = (): ProjectState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY),
      parsed = raw ? JSON.parse(raw) : null;
    return parsed
      ? {
          ...fresh(),
          ...parsed,
          selectedIds:
            parsed.selectedIds ??
            (parsed.selectedId ? [parsed.selectedId] : []),
          selectedKeyframeIds:
            parsed.selectedKeyframeIds ??
            (parsed.selectedKeyframeId ? [parsed.selectedKeyframeId] : []),
          formatOverrides: {
            ...blankOverrides(),
            ...(parsed.formatOverrides ?? {}),
          },
        }
      : fresh();
  } catch {
    return fresh();
  }
};
let state = load();
let past: ProjectState[] = [],
  future: ProjectState[] = [],
  historyGroup = "",
  historyTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
};
const remember = (group = "") => {
  if (!group || group !== historyGroup) {
    past = [...past.slice(-99), state];
    future = [];
  }
  historyGroup = group;
  if (historyTimer) clearTimeout(historyTimer);
  historyTimer = setTimeout(() => {
    historyGroup = "";
  }, 350);
};
const patch = (
  next: Partial<ProjectState> | ((s: ProjectState) => Partial<ProjectState>),
  options: { history?: boolean; group?: string } = {},
) => {
  if (options.history !== false) remember(options.group);
  state = { ...state, ...(typeof next === "function" ? next(state) : next) };
  emit();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const useEditorState = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
export const getEditorState = () => state;
const elementList = (s = state) => s.elementsByFormat[s.activeFormat] ?? [];
const frameMap = (s = state) => s.keyframesByFormat[s.activeFormat] ?? {};
const currentValue = (
  e: BannerElement,
  p: AnimatableProperty,
  time = state.playhead,
  s = state,
) =>
  interpolateValue(
    e[p],
    s.keyframesByFormat[s.activeFormat]?.[e.id] ?? [],
    p,
    time,
  );
const cloneFrames = (source: FormatKeyframes): FormatKeyframes =>
  Object.fromEntries(
    Object.entries(source).map(([id, list]) => [
      id,
      list.map((f) => ({
        ...f,
        id: crypto.randomUUID(),
        bezier: f.bezier ? ([...f.bezier] as Bezier) : undefined,
      })),
    ]),
  );
const adaptedState = (s: ProjectState, force = false) => {
  const master = s.elementsByFormat.master ?? [],
    masterFrames = s.keyframesByFormat.master ?? {},
    elements = { ...s.elementsByFormat },
    keys = { ...s.keyframesByFormat };
  for (const format of formats) {
    if (format.id === "master") continue;
    if (!force && s.formatOverrides[format.id]) continue;
    elements[format.id] = adaptMasterToFormat(master, format).elements;
    keys[format.id] = cloneFrames(masterFrames);
  }
  return { elementsByFormat: elements, keyframesByFormat: keys };
};
const touchOverride = (s: ProjectState) =>
  s.activeFormat === "master"
    ? s.formatOverrides
    : { ...s.formatOverrides, [s.activeFormat]: true };
const familyOf = (id: string) =>
  id === "half"
    ? "vertical"
    : id === "leader" || id === "mobile"
      ? "strip"
      : "rectangle";
const scopedFormats = (s: ProjectState, scope: FormatScope) =>
  scope === "campaign"
    ? formats.map((f) => f.id)
    : scope === "family"
      ? formats
          .filter((f) => familyOf(f.id) === familyOf(s.activeFormat))
          .map((f) => f.id)
      : [s.activeFormat];

export const editorActions = {
  setBackgroundColor(color: string) {
    patch((s) => ({
      backgrounds: { ...s.backgrounds, [s.activeFormat]: { color } },
    }));
  },
  addAsset(asset: AssetLibraryItem) {
    patch((s) => ({
      assets: [...s.assets.filter((item) => item.id !== asset.id), asset],
    }));
  },
  removeAsset(id: string) {
    patch((s) => ({ assets: s.assets.filter((item) => item.id !== id) }));
  },
  addAssetToCanvas(id: string, position?: { x: number; y: number }) {
    const asset = state.assets.find((item) => item.id === id);
    if (asset)
      this.addImage(asset.name, asset.assetUrl, position, {
        width: asset.width,
        height: asset.height,
      });
  },
  setPlayhead(time: number, keepKeySelection = false) {
    patch(
      {
        playhead: Math.max(0, Math.min(state.duration, time)),
        ...(keepKeySelection ? {} : { selectedKeyframeId: null }),
      },
      { history: false },
    );
  },
  setCanvasZoom(zoom: number) {
    patch(
      { canvasZoom: Math.max(0.25, Math.min(3, zoom)) },
      { history: false },
    );
  },
  setTimelineHeight(height: number) {
    patch(
      {
        timelineHeight: Math.max(
          116,
          Math.min(window.innerHeight - 150, height),
        ),
      },
      { history: false },
    );
  },
  setFrameRate(frameRate: number) {
    patch({
      frameRate: [24, 25, 30, 50, 60].includes(frameRate) ? frameRate : 30,
    });
  },
  setSnapEnabled(snapEnabled: boolean) {
    patch({ snapEnabled }, { history: false });
  },
  setDuration(raw: number) {
    const duration = Math.max(0.1, Math.min(120, Number(raw.toFixed(3))));
    patch((s) => {
      const old = s.duration;
      const elementsByFormat = Object.fromEntries(
        Object.entries(s.elementsByFormat).map(([formatId, list]) => [
          formatId,
          list.map((element) => {
            const oldOut = element.outPoint ?? old;
            return {
              ...element,
              inPoint: Math.min(
                element.inPoint ?? 0,
                Math.max(0, duration - 0.03),
              ),
              outPoint:
                oldOut >= old - 0.035
                  ? duration
                  : Math.max(0.03, Math.min(duration, oldOut)),
            };
          }),
        ]),
      );
      const keyframesByFormat = Object.fromEntries(
        Object.entries(s.keyframesByFormat).map(([formatId, map]) => [
          formatId,
          Object.fromEntries(
            Object.entries(map).map(([elementId, list]) => {
              const unique = new Map<string, Keyframe>();
              for (const frame of list) {
                const next = { ...frame, time: Math.min(duration, frame.time) };
                unique.set(`${next.property}:${next.time.toFixed(3)}`, next);
              }
              return [
                elementId,
                [...unique.values()].sort((a, b) => a.time - b.time),
              ];
            }),
          ),
        ]),
      );
      return {
        duration,
        elementsByFormat,
        keyframesByFormat,
        playhead: Math.min(duration, s.playhead),
        selectedKeyframeId: null,
        selectedKeyframeIds: [],
      };
    });
  },
  select(id: string | null, additive = false) {
    if (!id) {
      patch(
        {
          selectedId: null,
          selectedIds: [],
          selectedKeyframeId: null,
          selectedKeyframeIds: [],
        },
        { history: false },
      );
      return;
    }
    const current = state.selectedIds ?? [];
    const selectedIds = additive
      ? current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
      : [id];
    patch(
      {
        selectedId: selectedIds.at(-1) ?? null,
        selectedIds,
        selectedKeyframeId: null,
        selectedKeyframeIds: [],
      },
      { history: false },
    );
  },
  setFormat(id: string) {
    patch(
      (s) => {
        let next: Partial<ProjectState> = {
          activeFormat: id,
          selectedId: null,
          selectedIds: [],
          selectedKeyframeId: null,
          selectedKeyframeIds: [],
          playhead: 0,
        };
        if (id !== "master" && !s.elementsByFormat[id]?.length) {
          const format = formats.find((f) => f.id === id);
          if (format)
            next = {
              ...next,
              elementsByFormat: {
                ...s.elementsByFormat,
                [id]: adaptMasterToFormat(
                  s.elementsByFormat.master ?? [],
                  format,
                ).elements,
              },
              keyframesByFormat: {
                ...s.keyframesByFormat,
                [id]: cloneFrames(s.keyframesByFormat.master ?? {}),
              },
            };
        }
        return next;
      },
      { history: false },
    );
  },
  adaptAll(force = true) {
    patch((s) => ({
      ...adaptedState(s, force),
      formatOverrides: force ? blankOverrides() : s.formatOverrides,
    }));
  },
  resetFormatFromMaster(id = state.activeFormat) {
    if (id === "master") return;
    patch((s) => {
      const format = formats.find((f) => f.id === id);
      if (!format) return {};
      return {
        elementsByFormat: {
          ...s.elementsByFormat,
          [id]: adaptMasterToFormat(s.elementsByFormat.master ?? [], format)
            .elements,
        },
        keyframesByFormat: {
          ...s.keyframesByFormat,
          [id]: cloneFrames(s.keyframesByFormat.master ?? {}),
        },
        formatOverrides: { ...s.formatOverrides, [id]: false },
        selectedId: null,
        selectedKeyframeId: null,
        playhead: 0,
      };
    });
  },
  addText() {
    const el = createTextElement();
    patch((s) => {
      const elementsByFormat = {
        ...s.elementsByFormat,
        [s.activeFormat]: [...(s.elementsByFormat[s.activeFormat] ?? []), el],
      };
      const base = {
        elementsByFormat,
        selectedId: el.id,
        selectedIds: [el.id],
        formatOverrides: touchOverride(s),
      };
      return s.activeFormat === "master"
        ? {
            ...base,
            ...adaptedState({ ...s, elementsByFormat } as ProjectState, false),
          }
        : base;
    });
  },
  addImage(
    name: string,
    url: string,
    position?: { x: number; y: number },
    natural?: { width: number; height: number },
  ) {
    const format = formats.find((f) => f.id === state.activeFormat)!;
    const naturalWidth = natural?.width || format.width * 0.4,
      naturalHeight = natural?.height || naturalWidth * 0.65;
    const width = Math.max(
      1,
      Math.min(100, (naturalWidth / format.width) * 100),
    );
    const renderedHeight =
      (((naturalHeight / naturalWidth) * ((width / 100) * format.width)) /
        format.height) *
      100;
    const x = position?.x ?? Math.max(0, (100 - width) / 2),
      y = position?.y ?? Math.max(0, (100 - renderedHeight) / 2);
    const el: BannerElement = {
      id: crypto.randomUUID(),
      kind: "image",
      name,
      text: "",
      assetUrl: url,
      x,
      y,
      width,
      scale: 100,
      rotation: 0,
      opacity: 100,
      fontFamily: "Arial",
      fontSize: 16,
      lineHeight: 100,
      color: "#000000",
      inPoint: 0,
      outPoint: state.duration,
      locked: false,
      visible: true,
      contentLinked: true,
    };
    patch((s) => {
      const elementsByFormat = {
        ...s.elementsByFormat,
        [s.activeFormat]: [...(s.elementsByFormat[s.activeFormat] ?? []), el],
      };
      const base = {
        elementsByFormat,
        selectedId: el.id,
        selectedIds: [el.id],
        formatOverrides: touchOverride(s),
      };
      return s.activeFormat === "master"
        ? {
            ...base,
            ...adaptedState({ ...s, elementsByFormat } as ProjectState, false),
          }
        : base;
    });
  },
  reorderElement(id: string, toIndex: number) {
    patch((s) => {
      const list = [...(s.elementsByFormat[s.activeFormat] ?? [])],
        from = list.findIndex((e) => e.id === id);
      if (from < 0) return {};
      const [item] = list.splice(from, 1);
      list.splice(Math.max(0, Math.min(list.length, toIndex)), 0, item);
      return {
        elementsByFormat: { ...s.elementsByFormat, [s.activeFormat]: list },
        formatOverrides: touchOverride(s),
      };
    });
  },
  nudgeSelected(dxPixels: number, dyPixels: number) {
    const format = formats.find((f) => f.id === state.activeFormat);
    if (!format) return;
    for (const id of state.selectedIds ?? []) {
      const target = elementList().find((e) => e.id === id);
      if (!target || target.locked) continue;
      this.updateElement(
        id,
        {
          x: currentValue(target, "x") + (dxPixels / format.width) * 100,
          y: currentValue(target, "y") + (dyPixels / format.height) * 100,
        },
        true,
      );
    }
  },
  setLayerRange(id: string, inPoint: number, outPoint: number) {
    patch(
      (s) => ({
        elementsByFormat: {
          ...s.elementsByFormat,
          [s.activeFormat]: (s.elementsByFormat[s.activeFormat] ?? []).map(
            (e) =>
              e.id === id
                ? {
                    ...e,
                    inPoint: Math.max(0, Math.min(outPoint - 0.03, inPoint)),
                    outPoint: Math.min(
                      s.duration,
                      Math.max(inPoint + 0.03, outPoint),
                    ),
                  }
                : e,
          ),
        },
      }),
      { group: `range:${id}` },
    );
  },
  updateElement(id: string, values: Partial<BannerElement>, keyed = true) {
    const target = elementList().find((e) => e.id === id);
    if (!target) return;
    const anim = Object.entries(values).filter(([k]) =>
      ["x", "y", "scale", "rotation", "opacity"].includes(k),
    ) as [AnimatableProperty, number][];
    const stat = Object.fromEntries(
      Object.entries(values).filter(
        ([k]) => !["x", "y", "scale", "rotation", "opacity"].includes(k),
      ),
    ) as Partial<BannerElement>;
    const layerFrames = frameMap()[id] ?? [],
      hasAnyKey = layerFrames.length > 0,
      hasKey = layerFrames.some(
        (f) => Math.abs(f.time - state.playhead) < 0.035,
      );
    const group = `element:${id}:${Object.keys(values).sort().join(",")}`;
    if (Object.keys(stat).length || !keyed || !hasAnyKey)
      patch(
        (s) => {
          const source = (s.elementsByFormat[s.activeFormat] ?? []).find(
            (e) => e.id === id,
          );
          const contentKeys = new Set([
            "text",
            "assetUrl",
            "name",
            "fontFamily",
            "color",
            "textCase",
          ]);
          const shared =
            source?.contentLinked !== false &&
            Object.keys(stat).some((key) => contentKeys.has(key));
          const sharedPatch = Object.fromEntries(
            Object.entries(stat).filter(([key]) => contentKeys.has(key)),
          );
          const elementsByFormat = Object.fromEntries(
            Object.entries(s.elementsByFormat).map(([formatId, list]) => [
              formatId,
              list.map((e) =>
                e.id === id
                  ? {
                      ...e,
                      ...(formatId === s.activeFormat
                        ? stat
                        : shared
                          ? sharedPatch
                          : {}),
                      ...(formatId === s.activeFormat && (!keyed || !hasAnyKey)
                        ? Object.fromEntries(anim)
                        : {}),
                    }
                  : e,
              ),
            ]),
          );
          return { elementsByFormat, formatOverrides: touchOverride(s) };
        },
        { group },
      );
    if (keyed && anim.length && hasAnyKey)
      this.upsertProperties(
        id,
        Object.fromEntries(anim),
        "inOutCubic",
        [0.42, 0, 0.58, 1],
        group,
      );
  },
  upsertProperties(
    id: string,
    values: Partial<Record<AnimatableProperty, number>>,
    easing: Easing = "inOutCubic",
    bezier: Bezier = [0.42, 0, 0.58, 1],
    historyGroup?: string,
  ) {
    patch(
      (s) => {
        let list = [...(s.keyframesByFormat[s.activeFormat]?.[id] ?? [])];
        for (const [property, value] of Object.entries(values) as [
          AnimatableProperty,
          number,
        ][]) {
          const existing = list.find(
            (f) =>
              f.property === property && Math.abs(f.time - s.playhead) < 0.035,
          );
          const frame: Keyframe = {
            id: existing?.id ?? crypto.randomUUID(),
            time: s.playhead,
            property,
            value,
            easing: existing?.easing ?? easing,
            bezier: existing?.bezier ?? bezier,
          };
          list = [...list.filter((f) => f.id !== frame.id), frame].sort(
            (a, b) => a.time - b.time,
          );
        }
        const keyframesByFormat = {
          ...s.keyframesByFormat,
          [s.activeFormat]: {
            ...(s.keyframesByFormat[s.activeFormat] ?? {}),
            [id]: list,
          },
        };
        const base = { keyframesByFormat, formatOverrides: touchOverride(s) };
        return s.activeFormat === "master"
          ? {
              ...base,
              ...adaptedState(
                { ...s, keyframesByFormat } as ProjectState,
                false,
              ),
            }
          : base;
      },
      { group: historyGroup },
    );
  },
  toggleKeyAtCurrent(id: string) {
    const target = elementList().find((e) => e.id === id);
    if (!target) return;
    const at = (frameMap()[id] ?? []).filter(
      (f) => Math.abs(f.time - state.playhead) < 0.035,
    );
    if (at.length) {
      patch((s) => {
        const keyframesByFormat = {
          ...s.keyframesByFormat,
          [s.activeFormat]: {
            ...(s.keyframesByFormat[s.activeFormat] ?? {}),
            [id]: (s.keyframesByFormat[s.activeFormat]?.[id] ?? []).filter(
              (f) => Math.abs(f.time - s.playhead) >= 0.035,
            ),
          },
        };
        const base = {
          keyframesByFormat,
          selectedKeyframeId: null,
          selectedKeyframeIds: [],
          formatOverrides: touchOverride(s),
        };
        return s.activeFormat === "master"
          ? {
              ...base,
              ...adaptedState(
                { ...s, keyframesByFormat } as ProjectState,
                false,
              ),
            }
          : base;
      });
      return;
    }
    const values = Object.fromEntries(
      (["x", "y", "scale", "rotation", "opacity"] as AnimatableProperty[]).map(
        (p) => [p, currentValue(target, p, state.playhead, state)],
      ),
    );
    this.upsertProperties(id, values);
  },
  toggleKeysAtCurrent(ids: string[]) {
    for (const id of ids) this.toggleKeyAtCurrent(id);
  },
  selectKey(id: string, elementId: string, additive = false) {
    const group = (frameMap()[elementId] ?? []).filter((f) => {
      const chosen = (frameMap()[elementId] ?? []).find(
        (item) => item.id === id,
      );
      return chosen && Math.abs(f.time - chosen.time) < 0.035;
    });
    if (!group.length) return;
    const groupIds = group.map((f) => f.id),
      current = state.selectedKeyframeIds ?? [];
    const allSelected = groupIds.every((item) => current.includes(item));
    const selectedKeyframeIds = additive
      ? allSelected
        ? current.filter((item) => !groupIds.includes(item))
        : [...new Set([...current, ...groupIds])]
      : groupIds;
    const selectedIds = additive
      ? [...new Set([...(state.selectedIds ?? []), elementId])]
      : [elementId];
    patch(
      {
        selectedId: elementId,
        selectedIds,
        selectedKeyframeId: selectedKeyframeIds.at(-1) ?? null,
        selectedKeyframeIds,
        playhead: group[0].time,
      },
      { history: false },
    );
  },
  moveSelectedKeyframes(delta: number) {
    const ids = new Set(state.selectedKeyframeIds ?? []);
    if (!ids.size) return;
    patch(
      (s) => ({
        keyframesByFormat: {
          ...s.keyframesByFormat,
          [s.activeFormat]: Object.fromEntries(
            Object.entries(s.keyframesByFormat[s.activeFormat] ?? {}).map(
              ([elementId, list]) => [
                elementId,
                list
                  .map((f) =>
                    ids.has(f.id)
                      ? {
                          ...f,
                          time: Math.max(
                            0,
                            Math.min(s.duration, f.time + delta),
                          ),
                        }
                      : f,
                  )
                  .sort((a, b) => a.time - b.time),
              ],
            ),
          ),
        },
        playhead: Math.max(0, Math.min(s.duration, s.playhead + delta)),
      }),
      { group: "selected-keyframes" },
    );
  },
  moveKeyframeGroup(elementId: string, time: number, newTime: number) {
    patch(
      (s) => {
        const list = s.keyframesByFormat[s.activeFormat]?.[elementId] ?? [],
          previous = s.playhead;
        const clamped = Math.max(0, Math.min(s.duration, newTime));
        const keyframesByFormat = {
          ...s.keyframesByFormat,
          [s.activeFormat]: {
            ...(s.keyframesByFormat[s.activeFormat] ?? {}),
            [elementId]: list
              .map((f) =>
                Math.abs(f.time - time) < 0.035 ||
                Math.abs(f.time - previous) < 0.035
                  ? { ...f, time: clamped }
                  : f,
              )
              .sort((a, b) => a.time - b.time),
          },
        };
        return {
          keyframesByFormat,
          playhead: clamped,
          formatOverrides: touchOverride(s),
        };
      },
      { group: `keyframe:${elementId}` },
    );
  },
  deleteSelectedKeyframe() {
    if (!state.selectedId || !state.selectedKeyframeId) return;
    const id = state.selectedId,
      frame = (frameMap()[id] ?? []).find(
        (f) => f.id === state.selectedKeyframeId,
      );
    if (!frame) return;
    patch((s) => ({
      keyframesByFormat: {
        ...s.keyframesByFormat,
        [s.activeFormat]: {
          ...(s.keyframesByFormat[s.activeFormat] ?? {}),
          [id]: (s.keyframesByFormat[s.activeFormat]?.[id] ?? []).filter(
            (f) => Math.abs(f.time - frame.time) >= 0.035,
          ),
        },
      },
      selectedKeyframeId: null,
      formatOverrides: touchOverride(s),
    }));
  },
  deleteSelectedKeyframes() {
    const ids = new Set(state.selectedKeyframeIds ?? []);
    if (!ids.size) return;
    patch((s) => ({
      keyframesByFormat: {
        ...s.keyframesByFormat,
        [s.activeFormat]: Object.fromEntries(
          Object.entries(s.keyframesByFormat[s.activeFormat] ?? {}).map(
            ([id, list]) => [id, list.filter((f) => !ids.has(f.id))],
          ),
        ),
      },
      selectedKeyframeId: null,
      selectedKeyframeIds: [],
    }));
  },
  setSelectedKeyEasing(easing: Easing, bezier: Bezier) {
    if (!state.selectedId || !state.selectedKeyframeId) return;
    const id = state.selectedId,
      frame = (frameMap()[id] ?? []).find(
        (f) => f.id === state.selectedKeyframeId,
      );
    if (!frame) return;
    patch(
      (s) => ({
        keyframesByFormat: {
          ...s.keyframesByFormat,
          [s.activeFormat]: {
            ...(s.keyframesByFormat[s.activeFormat] ?? {}),
            [id]: (s.keyframesByFormat[s.activeFormat]?.[id] ?? []).map((f) =>
              Math.abs(f.time - frame.time) < 0.035
                ? { ...f, easing, bezier: [...bezier] as Bezier }
                : f,
            ),
          },
        },
      }),
      { group: `easing:${id}:${frame.time}` },
    );
  },
  setSelectedVisibility(visible: boolean, scope: FormatScope = "format") {
    const ids = new Set(
      state.selectedIds?.length
        ? state.selectedIds
        : state.selectedId
          ? [state.selectedId]
          : [],
    );
    if (!ids.size) return;
    patch((s) => {
      const targets = new Set(scopedFormats(s, scope));
      return {
        elementsByFormat: Object.fromEntries(
          Object.entries(s.elementsByFormat).map(([formatId, list]) => [
            formatId,
            list.map((element) =>
              targets.has(formatId) && ids.has(element.id)
                ? { ...element, visible }
                : element,
            ),
          ]),
        ),
        formatOverrides:
          scope === "format" ? touchOverride(s) : s.formatOverrides,
      };
    });
  },
  removeSelectedScoped(scope: FormatScope) {
    const ids = new Set(
      state.selectedIds?.length
        ? state.selectedIds
        : state.selectedId
          ? [state.selectedId]
          : [],
    );
    if (!ids.size) return;
    patch((s) => {
      const targets = new Set(scopedFormats(s, scope));
      const elementsByFormat = Object.fromEntries(
        Object.entries(s.elementsByFormat).map(([formatId, list]) => [
          formatId,
          targets.has(formatId)
            ? list.filter((element) => !ids.has(element.id))
            : list,
        ]),
      );
      const keyframesByFormat = Object.fromEntries(
        Object.entries(s.keyframesByFormat).map(([formatId, map]) => [
          formatId,
          targets.has(formatId)
            ? Object.fromEntries(
                Object.entries(map).filter(([id]) => !ids.has(id)),
              )
            : map,
        ]),
      );
      return {
        elementsByFormat,
        keyframesByFormat,
        selectedId: null,
        selectedIds: [],
        selectedKeyframeId: null,
        selectedKeyframeIds: [],
        formatOverrides:
          scope === "format" ? touchOverride(s) : s.formatOverrides,
      };
    });
  },
  removeSelected() {
    const ids = new Set(
      state.selectedIds?.length
        ? state.selectedIds
        : state.selectedId
          ? [state.selectedId]
          : [],
    );
    if (!ids.size) return;
    patch((s) => {
      const elementsByFormat = {
          ...s.elementsByFormat,
          [s.activeFormat]: (s.elementsByFormat[s.activeFormat] ?? []).filter(
            (e) => !ids.has(e.id),
          ),
        },
        keyframesByFormat = {
          ...s.keyframesByFormat,
          [s.activeFormat]: Object.fromEntries(
            Object.entries(s.keyframesByFormat[s.activeFormat] ?? {}).filter(
              ([k]) => !ids.has(k),
            ),
          ),
        };
      const base = {
        elementsByFormat,
        keyframesByFormat,
        selectedId: null,
        selectedIds: [],
        selectedKeyframeId: null,
        selectedKeyframeIds: [],
        formatOverrides: touchOverride(s),
      };
      return s.activeFormat === "master"
        ? {
            ...base,
            ...adaptedState(
              { ...s, elementsByFormat, keyframesByFormat } as ProjectState,
              false,
            ),
          }
        : base;
    });
  },
  undo() {
    const previous = past.pop();
    if (!previous) return;
    future = [state, ...future.slice(0, 99)];
    state = previous;
    historyGroup = "";
    emit();
  },
  redo() {
    const next = future.shift();
    if (!next) return;
    past = [...past.slice(-99), state];
    state = next;
    historyGroup = "";
    emit();
  },
  canUndo() {
    return past.length > 0;
  },
  canRedo() {
    return future.length > 0;
  },
  newProject() {
    remember();
    state = fresh();
    emit();
  },
  importProject(project: ProjectState) {
    remember();
    state = {
      ...fresh(),
      ...project,
      version: 2,
      selectedIds:
        project.selectedIds ?? (project.selectedId ? [project.selectedId] : []),
      selectedKeyframeIds:
        project.selectedKeyframeIds ??
        (project.selectedKeyframeId ? [project.selectedKeyframeId] : []),
      formatOverrides: {
        ...blankOverrides(),
        ...(project.formatOverrides ?? {}),
      },
    };
    emit();
  },
  exportProject() {
    return JSON.stringify(state, null, 2);
  },
};
export const getDisplayElement = (
  element: BannerElement,
  time = state.playhead,
): BannerElement => ({
  ...element,
  x: currentValue(element, "x", time, state),
  y: currentValue(element, "y", time, state),
  scale: currentValue(element, "scale", time, state),
  rotation: currentValue(element, "rotation", time, state),
  opacity: currentValue(element, "opacity", time, state),
});
