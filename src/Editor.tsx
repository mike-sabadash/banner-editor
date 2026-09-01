import { useEffect, useMemo, useRef, useState } from "react";
import BezierEditor from "bezier-easing-editor";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  Image,
  Lock,
  MousePointer2,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Square,
  Sun,
  Trash2,
  Type,
  Unlock,
  Upload,
} from "lucide-react";
import {
  adaptMasterToFormat,
  createTextElement,
  defaultBannerSettings,
  fitPreview,
  formats,
  platformProfiles,
  type AdaptationDecision,
  type BannerElement,
  type BannerSettings,
} from "./model";
import {
  interpolateValue,
  moveKeyframe,
  setEasingAtTime,
  snapTimelineTime,
  upsertKeyframe,
  type AnimatableProperty,
  type Bezier,
  type Easing,
  type FormatKeyframes,
} from "./timeline";
import "./editor.css";

type Asset = {
  id: string;
  name: string;
  group: "primary" | "additional";
  type: "image" | "font";
  url: string;
};
type FormatBackground = { color: string };
const DURATION = 6,
  ANIMATABLE: AnimatableProperty[] = ["x", "y", "scale", "rotation", "opacity"];
const CYRILLIC_FONTS = [
  "Manrope",
  "Inter",
  "Arial",
  "Helvetica Neue",
  "Roboto",
  "PT Sans",
  "PT Serif",
  "Noto Sans",
  "Noto Serif",
  "IBM Plex Sans",
  "Georgia",
  "Times New Roman",
];
const EASING_PRESETS: { name: string; value: Bezier }[] = [
  { name: "Linear", value: [0, 0, 1, 1] },
  { name: "S-curve", value: [0.42, 0, 0.58, 1] },
  { name: "Snap", value: [0.22, 1, 0.36, 1] },
  { name: "Snap reverse", value: [0.64, 0, 0.78, 0] },
  { name: "Pop", value: [0.2, 0.8, 0.2, 1] },
];
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const blankFormats = () =>
  Object.fromEntries(formats.map((f) => [f.id, [] as BannerElement[]]));
const blankKeyframes = () =>
  Object.fromEntries(formats.map((f) => [f.id, {} as FormatKeyframes]));
const cloneElements = (items: BannerElement[]) =>
  items.map((item) => ({ ...item }));
const cloneFrames = (source: FormatKeyframes): FormatKeyframes =>
  Object.fromEntries(
    Object.entries(source).map(([id, frames]) => [
      id,
      frames.map((frame) => ({ ...frame, id: crypto.randomUUID() })),
    ]),
  );
const blankBackgrounds = () =>
  Object.fromEntries(
    formats.map((format) => [format.id, { color: "#ffffff" }]),
  ) as Record<string, FormatBackground>;

export default function Editor() {
  const [activeFormat, setActiveFormat] = useState("master");
  const [elementsByFormat, setElementsByFormat] = useState<
    Record<string, BannerElement[]>
  >(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("banner-editor:v3:elements") || "") ||
        blankFormats()
      );
    } catch {
      return blankFormats();
    }
  });
  const [keyframesByFormat, setKeyframesByFormat] = useState<
    Record<string, FormatKeyframes>
  >(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("banner-editor:v3:keyframes") || "") ||
        blankKeyframes()
      );
    } catch {
      return blankKeyframes();
    }
  });
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem("banner-editor:v3:assets") || "") || []
      );
    } catch {
      return [];
    }
  });
  const [backgrounds, setBackgrounds] = useState<
    Record<string, FormatBackground>
  >(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("banner-editor:v3:backgrounds") || "",
        ) || blankBackgrounds()
      );
    } catch {
      return blankBackgrounds();
    }
  });
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    localStorage.getItem("banner-editor:v3:theme") === "light"
      ? "light"
      : "dark",
  );
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [platformId, setPlatformId] = useState("google"),
    [playhead, setPlayhead] = useState(0),
    [playing, setPlaying] = useState(false),
    [zoom, setZoom] = useState(74),
    [timelineZoom, setTimelineZoom] = useState(1),
    [easing, setEasing] = useState<Easing>("ease-in-out"),
    [bezier, setBezier] = useState<Bezier>([0.42, 0, 0.58, 1]),
    [curveOpen, setCurveOpen] = useState(false);
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>(() => {
      try {
        return (
          JSON.parse(localStorage.getItem("banner-editor:v3:settings") || "") ||
          defaultBannerSettings
        );
      } catch {
        return defaultBannerSettings;
      }
    }),
    [adaptationDecisions, setAdaptationDecisions] = useState<
      Record<string, AdaptationDecision[]>
    >({});
  const uploadGroup = useRef<Asset["group"]>("primary"),
    fileInput = useRef<HTMLInputElement>(null),
    backgroundInput = useRef<HTMLInputElement>(null),
    backgroundFormat = useRef("master");
  const format = formats.find((item) => item.id === activeFormat)!,
    elements = elementsByFormat[activeFormat] ?? [],
    selected = elements.find((item) => item.id === selectedId) ?? null,
    frames = keyframesByFormat[activeFormat] ?? {};
  const preview = useMemo(
      () => fitPreview(format.width, format.height, 700, 400),
      [format],
    ),
    platform = platformProfiles.find((item) => item.id === platformId)!;

  useEffect(() => {
    try {
      localStorage.setItem(
        "banner-editor:v3:elements",
        JSON.stringify(elementsByFormat),
      );
    } catch (error) {
      console.warn("Could not persist elements", error);
    }
  }, [elementsByFormat]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "banner-editor:v3:keyframes",
        JSON.stringify(keyframesByFormat),
      );
    } catch (error) {
      console.warn("Could not persist keyframes", error);
    }
  }, [keyframesByFormat]);
  useEffect(() => {
    try {
      localStorage.setItem("banner-editor:v3:assets", JSON.stringify(assets));
    } catch {}
  }, [assets]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "banner-editor:v3:settings",
        JSON.stringify(bannerSettings),
      );
    } catch {}
  }, [bannerSettings]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "banner-editor:v3:backgrounds",
        JSON.stringify(backgrounds),
      );
    } catch {}
  }, [backgrounds]);
  useEffect(() => {
    localStorage.setItem("banner-editor:v3:theme", theme);
  }, [theme]);
  useEffect(() => {
    assets
      .filter((asset) => asset.type === "font")
      .forEach((asset) => {
        const family = asset.name.replace(/\.[^.]+$/, "");
        const face = new FontFace(family, `url(${asset.url})`);
        face
          .load()
          .then((loaded) => document.fonts.add(loaded))
          .catch(() => undefined);
      });
  }, [assets]);
  useEffect(() => {
    if (!playing) return;
    const start = performance.now() - playhead * 1000;
    let request = 0;
    const tick = (now: number) => {
      const time = (now - start) / 1000;
      if (time >= DURATION) {
        setPlayhead(DURATION);
        setPlaying(false);
        return;
      }
      setPlayhead(time);
      request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing]);
  useEffect(() => {
    setElementsByFormat((all) => {
      const master = all.master ?? [];
      let changed = false;
      const next = { ...all };
      for (const target of formats.filter((item) => item.id !== "master")) {
        if (!all[target.id]?.length) continue;
        const adapted = adaptMasterToFormat(master, target).elements,
          existing = new Map(
            (all[target.id] ?? []).map((item) => [item.id, item]),
          );
        const missing = adapted.filter((item) => !existing.has(item.id));
        if (missing.length) {
          next[target.id] = [...(all[target.id] ?? []), ...missing];
          changed = true;
        }
      }
      return changed ? next : all;
    });
  }, [elementsByFormat.master]);

  const updateElements = (fn: (items: BannerElement[]) => BannerElement[]) =>
    setElementsByFormat((all) => ({
      ...all,
      [activeFormat]: fn(all[activeFormat] ?? []),
    }));
  const writeKeys = (
    id: string,
    patch: Partial<Record<AnimatableProperty, number>>,
  ) =>
    setKeyframesByFormat((all) => {
      let list = all[activeFormat]?.[id] ?? [];
      for (const [property, value] of Object.entries(patch) as [
        AnimatableProperty,
        number,
      ][])
        list = upsertKeyframe(list, {
          id: crypto.randomUUID(),
          time: playhead,
          property,
          value,
          easing,
          bezier: [...bezier] as Bezier,
        });
      return {
        ...all,
        [activeFormat]: { ...(all[activeFormat] ?? {}), [id]: list },
      };
    });
  const applyAnimated = (
    id: string,
    patch: Partial<Record<AnimatableProperty, number>>,
  ) =>
    playhead > 0.01
      ? writeKeys(id, patch)
      : updateElements((all) =>
          all.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        );
  const animatedValue = (
    element: BannerElement,
    property: AnimatableProperty,
  ) => {
    return interpolateValue(
      element[property],
      frames[element.id] ?? [],
      property,
      playhead,
    );
  };
  const displayElements = elements.map((element) => ({
      ...element,
      ...Object.fromEntries(
        ANIMATABLE.map((p) => [p, animatedValue(element, p)]),
      ),
    })) as BannerElement[],
    selectedDisplay =
      displayElements.find((item) => item.id === selectedId) ?? null;
  const updateSelected = (patch: Partial<BannerElement>) => {
    if (!selected) return;
    const animated = Object.fromEntries(
        Object.entries(patch).filter(([key]) =>
          ANIMATABLE.includes(key as AnimatableProperty),
        ),
      ) as Partial<Record<AnimatableProperty, number>>,
      staticPatch = Object.fromEntries(
        Object.entries(patch).filter(
          ([key]) => !ANIMATABLE.includes(key as AnimatableProperty),
        ),
      ) as Partial<BannerElement>;
    if (Object.keys(staticPatch).length)
      updateElements((all) =>
        all.map((item) =>
          item.id === selected.id ? { ...item, ...staticPatch } : item,
        ),
      );
    if (Object.keys(animated).length) applyAnimated(selected.id, animated);
  };

  const adaptFromMaster = (id: string, force = false) => {
    if (id === "master" || (!force && (elementsByFormat[id]?.length ?? 0) > 0))
      return;
    const master = elementsByFormat.master ?? [],
      target = formats.find((item) => item.id === id)!;
    const adapted = adaptMasterToFormat(master, target);
    setElementsByFormat((all) => ({ ...all, [id]: adapted.elements }));
    setKeyframesByFormat((all) => ({
      ...all,
      [id]: cloneFrames(all.master ?? {}),
    }));
    setAdaptationDecisions((all) => ({ ...all, [id]: adapted.decisions }));
    setSelectedId(master[0]?.id ?? null);
  };
  const adaptAllFormats = () => {
    const master = elementsByFormat.master ?? [];
    setElementsByFormat((all) => {
      const next = { ...all };
      for (const target of formats.filter((item) => item.id !== "master")) {
        const adapted = adaptMasterToFormat(master, target);
        next[target.id] = adapted.elements;
        setAdaptationDecisions((current) => ({
          ...current,
          [target.id]: adapted.decisions,
        }));
      }
      return next;
    });
    setKeyframesByFormat((all) => {
      const next = { ...all };
      for (const target of formats.filter((item) => item.id !== "master"))
        next[target.id] = cloneFrames(all.master ?? {});
      return next;
    });
  };
  const switchFormat = (id: string) => {
    const empty = id !== "master" && (elementsByFormat[id]?.length ?? 0) === 0;
    if (empty) adaptFromMaster(id);
    setActiveFormat(id);
    const target = empty
      ? (elementsByFormat.master ?? [])
      : (elementsByFormat[id] ?? []);
    setSelectedId(
      target.some((item) => item.id === selectedId)
        ? selectedId
        : (target[0]?.id ?? null),
    );
    setPlayhead(0);
    setPlaying(false);
  };
  const syncMaster = () => {
    if (activeFormat === "master") return;
    if (
      elements.length &&
      !window.confirm(
        "Replace this format from master? Local overrides will be reset.",
      )
    )
      return;
    adaptFromMaster(activeFormat, true);
    setPlayhead(0);
  };
  const addText = () => {
    const item = createTextElement();
    updateElements((all) => [...all, item]);
    setSelectedId(item.id);
  };
  const duplicate = () => {
    if (!selected) return;
    const copy = {
      ...selected,
      id: crypto.randomUUID(),
      name: `${selected.name} copy`,
      x: selected.x + 3,
      y: selected.y + 3,
    };
    updateElements((all) => [...all, copy]);
    setSelectedId(copy.id);
  };
  const remove = () => {
    if (!selected) return;
    updateElements((all) => all.filter((item) => item.id !== selected.id));
    setSelectedId(null);
  };
  const toggleLock = (id: string) =>
      updateElements((all) =>
        all.map((item) =>
          item.id === id ? { ...item, locked: !item.locked } : item,
        ),
      ),
    toggleVisible = (id: string) =>
      updateElements((all) =>
        all.map((item) =>
          item.id === id ? { ...item, visible: !item.visible } : item,
        ),
      );
  const startMove = (event: React.PointerEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    const item = displayElements.find((e) => e.id === id);
    if (!item || item.locked) return;
    setPlaying(false);
    setSelectedId(id);
    const sx = event.clientX,
      sy = event.clientY;
    const move = (p: PointerEvent) => {
      let dx = ((p.clientX - sx) / preview.width) * 100,
        dy = ((p.clientY - sy) / preview.height) * 100;
      if (p.shiftKey) {
        if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
        else dx = 0;
      }
      applyAnimated(id, {
        x: clamp(item.x + dx, 0, 100),
        y: clamp(item.y + dy, 0, 100),
      });
    };
    const end = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
  };
  const startScale = (event: React.PointerEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    const item = displayElements.find((e) => e.id === id),
      box = (
        event.currentTarget.parentElement as HTMLElement
      )?.getBoundingClientRect();
    if (!item || item.locked || !box) return;
    const cx = box.left + box.width / 2,
      cy = box.top + box.height / 2,
      start = Math.max(1, Math.hypot(event.clientX - cx, event.clientY - cy));
    const move = (p: PointerEvent) => {
      let value = clamp(
        (item.scale * Math.hypot(p.clientX - cx, p.clientY - cy)) / start,
        10,
        500,
      );
      if (p.shiftKey) value = Math.round(value / 10) * 10;
      applyAnimated(id, { scale: value });
    };
    const end = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
  };
  const startRotate = (event: React.PointerEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    const item = displayElements.find((e) => e.id === id),
      box = (
        event.currentTarget.parentElement as HTMLElement
      )?.getBoundingClientRect();
    if (!item || item.locked || !box) return;
    const cx = box.left + box.width / 2,
      cy = box.top + box.height / 2,
      start =
        (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI;
    const move = (p: PointerEvent) => {
      let value =
        item.rotation +
        (Math.atan2(p.clientY - cy, p.clientX - cx) * 180) / Math.PI -
        start;
      value = p.shiftKey ? Math.round(value / 15) * 15 : Math.round(value);
      applyAnimated(id, { rotation: value });
    };
    const end = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
  };
  const scrub = (event: React.PointerEvent, property: AnimatableProperty) => {
    if (!selectedDisplay || selectedDisplay.locked) return;
    event.preventDefault();
    const sx = event.clientX,
      start = selectedDisplay[property],
      speed = property === "opacity" || property === "scale" ? 1 : 0.2;
    const move = (p: PointerEvent) => {
      let value = start + (p.clientX - sx) * speed * (p.shiftKey ? 5 : 1);
      if (property === "opacity") value = clamp(value, 0, 100);
      if (property === "scale") value = clamp(value, 10, 500);
      applyAnimated(selectedDisplay.id, { [property]: value });
    };
    const end = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
  };

  const openUpload = (group: Asset["group"]) => {
    uploadGroup.current = group;
    fileInput.current?.click();
  };
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const group = uploadGroup.current,
      items = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<Asset>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  id: crypto.randomUUID(),
                  name: file.name,
                  group,
                  type: /\.(woff2?|ttf|otf)$/i.test(file.name)
                    ? "font"
                    : "image",
                  url: String(reader.result),
                });
              reader.onerror = reject;
              reader.readAsDataURL(file);
            }),
        ),
      );
    setAssets((all) => [...all, ...items]);
    if (fileInput.current) fileInput.current.value = "";
  };
  const openBackgroundUpload = (formatId: string) => {
    backgroundFormat.current = formatId;
    backgroundInput.current?.click();
  };
  const uploadBackground = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const formatId = backgroundFormat.current;
    const reader = new FileReader();
    reader.onload = () => {
      const target = formats.find((item) => item.id === formatId)!;
      const item: BannerElement = {
        id: `background-${formatId}`,
        kind: "image",
        name: `Background · ${target.label}`,
        text: "",
        assetUrl: String(reader.result),
        x: 0,
        y: 0,
        width: 100,
        scale: 100,
        rotation: 0,
        opacity: 100,
        fontFamily: "Arial",
        fontSize: 16,
        lineHeight: 100,
        color: "#000000",
        locked: false,
        visible: true,
      };
      setElementsByFormat((current) => ({
        ...current,
        [formatId]: [
          item,
          ...(current[formatId] ?? []).filter(
            (element) => element.id !== item.id,
          ),
        ],
      }));
      if (formatId === activeFormat) setSelectedId(item.id);
    };
    reader.readAsDataURL(file);
    if (backgroundInput.current) backgroundInput.current.value = "";
  };
  const placeAsset = (asset: Asset) => {
    if (asset.type === "font") {
      if (selected?.kind !== "image")
        updateSelected({ fontFamily: asset.name.replace(/\.[^.]+$/, "") });
      return;
    }
    const item: BannerElement = {
      id: crypto.randomUUID(),
      kind: "image",
      name: asset.name,
      text: "",
      assetUrl: asset.url,
      x: 25,
      y: 25,
      width: 40,
      scale: 100,
      rotation: 0,
      opacity: 100,
      fontFamily: "Arial",
      fontSize: 16,
      lineHeight: 100,
      color: "#000000",
      locked: false,
      visible: true,
    };
    updateElements((all) => [...all, item]);
    setSelectedId(item.id);
  };
  const addKey = (property: AnimatableProperty) => {
    if (selectedDisplay)
      writeKeys(selectedDisplay.id, { [property]: selectedDisplay[property] });
  };
  const allKeyTimes = Object.values(frames)
    .flat()
    .map((frame) => frame.time);
  const playheadSnapped = allKeyTimes.some(
    (time) => Math.abs(time - playhead) < 0.025,
  );
  const zoomCanvas = (event: React.WheelEvent) => {
    event.preventDefault();
    setZoom((value) =>
      clamp(Math.round(value * (event.deltaY > 0 ? 0.92 : 1.08)), 25, 200),
    );
  };
  const zoomTimeline = (event: React.WheelEvent) => {
    event.preventDefault();
    setTimelineZoom((value) =>
      clamp(value * (event.deltaY > 0 ? 0.9 : 1.1), 0.6, 4),
    );
  };
  const applyEasing = (
    value: Easing,
    curve: Bezier = bezier,
    updateCurve = true,
  ) => {
    setEasing(value);
    if (value === "custom" && updateCurve) setBezier(curve);
    if (!selectedId) return;
    setKeyframesByFormat((all) => ({
      ...all,
      [activeFormat]: {
        ...(all[activeFormat] ?? {}),
        [selectedId]: setEasingAtTime(
          all[activeFormat]?.[selectedId] ?? [],
          playhead,
          value,
          curve,
        ),
      },
    }));
  };
  const activeBezier: Bezier =
    easing === "linear"
      ? [0, 0, 1, 1]
      : easing === "ease-in"
        ? [0.42, 0, 1, 1]
        : easing === "ease-out"
          ? [0, 0, 0.58, 1]
          : easing === "ease-in-out"
            ? [0.42, 0, 0.58, 1]
            : bezier;
  const dragKey = (
    event: React.PointerEvent,
    elementId: string,
    id: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const original = (frames[elementId] ?? []).find((f) => f.id === id);
    if (!original) return;
    const sx = event.clientX,
      candidates = allKeyTimes.filter((time) => time !== original.time);
    const move = (p: PointerEvent) => {
      const raw = original.time + ((p.clientX - sx) / 600) * DURATION,
        time = snapTimelineTime(raw, candidates);
      setPlayhead(time);
      setKeyframesByFormat((all) => ({
        ...all,
        [activeFormat]: {
          ...(all[activeFormat] ?? {}),
          [elementId]: moveKeyframe(
            all[activeFormat]?.[elementId] ?? [],
            id,
            time,
          ),
        },
      }));
    };
    const end = () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
    };
    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
  };
  const seek = (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    const box = event.currentTarget.getBoundingClientRect();
    setPlaying(false);
    const set = (x: number) =>
      setPlayhead(
        snapTimelineTime(((x - box.left) / box.width) * DURATION, allKeyTimes),
      );
    set(event.clientX);
    const move = (p: PointerEvent) => set(p.clientX),
      end = () => {
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", end);
      };
    addEventListener("pointermove", move);
    addEventListener("pointerup", end);
  };
  const jump = (id: string, direction: -1 | 1) => {
    const times = [...new Set((frames[id] ?? []).map((f) => f.time))].sort(
        (a, b) => a - b,
      ),
      target =
        direction < 0
          ? [...times].reverse().find((t) => t < playhead - 0.01)
          : times.find((t) => t > playhead + 0.01);
    if (target !== undefined) {
      setPlaying(false);
      setPlayhead(target);
    }
  };
  const stop = () => {
      setPlaying(false);
      setPlayhead(0);
    },
    previewAll = () => {
      setPlayhead(0);
      setPlaying(true);
    };
  const exportHtml = () => {
    const style = (item: BannerElement) =>
      `position:absolute;left:${item.x}%;top:${item.y}%;width:${item.width}%;transform-origin:left top;transform:rotate(${item.rotation}deg) scale(${item.scale / 100});opacity:${item.opacity / 100};font:${item.fontSize}px/${item.lineHeight / 100} ${item.fontFamily};color:${item.color};white-space:pre-wrap`;
    const body = displayElements
      .filter((i) => i.visible)
      .map((i) =>
        i.kind === "image"
          ? `<img src="${i.assetUrl}" style="${style(i)}">`
          : `<div style="${style(i)}">${i.text.replaceAll("<", "&lt;")}</div>`,
      )
      .join("");
    const variable = /^[A-Za-z_$][\w$]*$/.test(bannerSettings.clickVariable)
        ? bannerSettings.clickVariable
        : "clickTag",
      interaction = bannerSettings.clickSurface
        ? `<script>var ${variable}="";document.body.addEventListener("click",function(){var target=window["${variable}"];if(target)window.open(target,"_blank")})</script>`
        : "",
      border = bannerSettings.borderEnabled
        ? `border:1px solid ${bannerSettings.borderColor};`
        : "",
      formatBackground = backgrounds[activeFormat] ?? { color: "#ffffff" },
      backgroundStyle = `background-color:${formatBackground.color};`;
    const html = `<!doctype html><meta name="ad.size" content="width=${format.width},height=${format.height}"><style>*{box-sizing:border-box}body{margin:0;position:relative;overflow:hidden;width:${format.width}px;height:${format.height}px;${backgroundStyle}${border}${bannerSettings.clickSurface ? "cursor:pointer;" : ""}}</style>${body}${interaction}`,
      link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    link.download = `banner-${format.width}x${format.height}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  return (
    <div className={`v2-app theme-${theme}`}>
      <header className="v2-top">
        <div className="v2-logo">B</div>
        <div>
          <b>Untitled campaign</b>
          <small>Local draft</small>
        </div>
        <div className="v2-top-actions">
          <button
            type="button"
            title="Switch theme"
            onClick={() =>
              setTheme((value) => (value === "dark" ? "light" : "dark"))
            }
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              previewAll();
            }}
          >
            <Play size={16} /> Preview
          </button>
          <button type="button" className="primary" onClick={exportHtml}>
            <Download size={16} /> Export HTML
          </button>
        </div>
      </header>
      <div className="v2-main">
        <aside className="v2-library">
          <div className="v2-panel-title">
            <span>LIBRARY</span>
            <b>Assets</b>
          </div>
          <input
            ref={fileInput}
            hidden
            type="file"
            multiple
            accept="image/*,.svg,.woff,.woff2,.ttf,.otf"
            onChange={(e) => upload(e.target.files)}
          />
          <input
            ref={backgroundInput}
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => uploadBackground(event.target.files)}
          />
          {(["primary", "additional"] as Asset["group"][]).map((group) => (
            <section className="v2-assets" key={group}>
              <div>
                <b>{group === "primary" ? "Primary set" : "Additional set"}</b>
                <button type="button" onClick={() => openUpload(group)}>
                  <Plus size={14} /> Add
                </button>
              </div>
              {assets.filter((a) => a.group === group).length === 0 ? (
                <button
                  type="button"
                  className="asset-empty"
                  onClick={() => openUpload(group)}
                >
                  <Upload size={17} /> Upload assets
                </button>
              ) : (
                <div className="v2-asset-grid">
                  {assets
                    .filter((a) => a.group === group)
                    .map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onDoubleClick={() => placeAsset(a)}
                        style={
                          a.type === "image"
                            ? { backgroundImage: `url(${a.url})` }
                            : undefined
                        }
                      >
                        {a.type === "font" && <Type />}
                        <span>{a.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </section>
          ))}
          <div className="v2-panel-title formats">
            <span>CAMPAIGN</span>
            <b>Formats</b>
          </div>
          {formats.map((item) => (
            <div className="format-row" key={item.id}>
              <button
                type="button"
                className={`v2-format ${item.id === activeFormat ? "active" : ""}`}
                onClick={() => switchFormat(item.id)}
              >
                <i style={{ aspectRatio: `${item.width}/${item.height}` }} />
                <span>
                  <b>{item.label}</b>
                  <small>
                    {item.width} × {item.height}
                  </small>
                </span>
              </button>
              <button
                type="button"
                className="format-background-upload"
                title={`Upload background for ${item.label}`}
                onClick={() => openBackgroundUpload(item.id)}
              >
                <Upload size={14} />
              </button>
            </div>
          ))}
        </aside>
        <section className="v2-stage">
          <div className="v2-stagebar">
            <b>{format.label}</b>
            <span>
              {format.width} × {format.height}
            </span>
            <div>
              {activeFormat === "master" && (
                <button type="button" onClick={adaptAllFormats}>
                  <RefreshCw size={15} /> Adapt all formats
                </button>
              )}
              {activeFormat !== "master" && (
                <button type="button" onClick={syncMaster}>
                  <RefreshCw size={15} /> Resize from master
                </button>
              )}
              <button type="button" onClick={addText}>
                <Type size={15} /> Text
              </button>
              <button type="button" onClick={() => openUpload("primary")}>
                <Image size={15} /> Image
              </button>
              <label>
                Zoom{" "}
                <input
                  type="range"
                  min="25"
                  max="200"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                <span>{zoom}%</span>
              </label>
            </div>
          </div>
          <div
            className="v2-canvas-area"
            onWheel={zoomCanvas}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
          >
            <div
              className="v2-canvas"
              style={{
                width: preview.width,
                height: preview.height,
                transform: `scale(${zoom / 74})`,
                backgroundColor: backgrounds[activeFormat]?.color ?? "#ffffff",
              }}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setSelectedId(null);
              }}
            >
              {!displayElements.length && (
                <div className="canvas-empty">
                  <MousePointer2 size={24} />
                  <b>
                    {activeFormat === "master"
                      ? "Empty master"
                      : "No adaptation yet"}
                  </b>
                  <span>
                    {activeFormat === "master"
                      ? "Add text or place an asset"
                      : "Use Resize from master"}
                  </span>
                </div>
              )}
              {displayElements
                .filter((e) => e.visible)
                .map((e) => (
                  <div
                    className={`v2-object ${e.id === selectedId ? "selected" : ""} ${e.locked ? "locked" : ""} ${e.id === `background-${activeFormat}` ? "background-layer" : ""}`}
                    key={e.id}
                    style={{
                      left: `${e.x}%`,
                      top: `${e.y}%`,
                      width: `${(e.width * e.scale) / 100}%`,
                      transform: `rotate(${e.rotation}deg)`,
                      opacity: e.opacity / 100,
                      fontFamily: e.fontFamily,
                      fontSize:
                        (((e.fontSize * e.scale) / 100) * preview.width) / 700,
                      lineHeight: e.lineHeight / 100,
                      color: e.color,
                      zIndex: e.id === selectedId ? 20 : 1,
                    }}
                    onPointerDown={(event) => startMove(event, e.id)}
                  >
                    {e.kind === "image" ? (
                      <img src={e.assetUrl} alt="" />
                    ) : (
                      e.text
                    )}
                    {e.id === selectedId && !e.locked && (
                      <>
                        <i
                          className="handle nw"
                          onPointerDown={(event) => startScale(event, e.id)}
                        />
                        <i
                          className="handle ne"
                          onPointerDown={(event) => startScale(event, e.id)}
                        />
                        <i
                          className="handle sw"
                          onPointerDown={(event) => startScale(event, e.id)}
                        />
                        <i
                          className="handle se"
                          onPointerDown={(event) => startScale(event, e.id)}
                        />
                        <i
                          className="rotate"
                          onPointerDown={(event) => startRotate(event, e.id)}
                        />
                      </>
                    )}
                  </div>
                ))}
              <i className="canvas-overscan" />
              <i
                className="banner-border"
                style={{
                  borderColor: bannerSettings.borderEnabled
                    ? bannerSettings.borderColor
                    : "transparent",
                }}
              />
            </div>
          </div>
        </section>
        <aside className="v2-inspector">
          <div className="v2-inspector-scroll">
            <div className="v2-panel-title">
              <span>LAYERS</span>
              <b>{elements.length} layers</b>
            </div>
            <div className="v2-layers">
              {!elements.length ? (
                <p>No layers yet</p>
              ) : (
                elements
                  .slice()
                  .reverse()
                  .map((e) => (
                    <div
                      className={`v2-layer ${e.id === selectedId ? "active" : ""}`}
                      key={e.id}
                    >
                      <button type="button" onClick={() => toggleVisible(e.id)}>
                        {e.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button
                        type="button"
                        className="layer-name"
                        onClick={() => setSelectedId(e.id)}
                      >
                        {e.kind === "image" ? (
                          <Image size={15} />
                        ) : (
                          <Type size={15} />
                        )}
                        <span>{e.name}</span>
                      </button>
                      <button
                        type="button"
                        className={e.locked ? "on" : ""}
                        onClick={() => toggleLock(e.id)}
                      >
                        {e.locked ? <Lock size={15} /> : <Unlock size={15} />}
                      </button>
                    </div>
                  ))
              )}
            </div>
            {selected && selectedDisplay ? (
              <>
                <div className="v2-object-actions">
                  <button type="button" onClick={duplicate}>
                    <Copy size={15} /> Duplicate
                  </button>
                  <button type="button" onClick={remove}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
                {selected.kind !== "image" && (
                  <section className="v2-section">
                    <button type="button" className="section-head">
                      <ChevronDown size={16} /> Typography
                    </button>
                    <textarea
                      value={selected.text}
                      onChange={(e) => updateSelected({ text: e.target.value })}
                    />
                    <div className="v2-type-row">
                      <select
                        value={selected.fontFamily}
                        onChange={(e) =>
                          updateSelected({ fontFamily: e.target.value })
                        }
                      >
                        {CYRILLIC_FONTS.map((font) => (
                          <option key={font}>{font}</option>
                        ))}
                        {assets
                          .filter((asset) => asset.type === "font")
                          .map((asset) => {
                            const family = asset.name.replace(/\.[^.]+$/, "");
                            return (
                              <option key={asset.id} value={family}>
                                {family} · uploaded
                              </option>
                            );
                          })}
                      </select>
                      <input
                        type="number"
                        value={selected.fontSize}
                        onChange={(e) =>
                          updateSelected({ fontSize: Number(e.target.value) })
                        }
                      />
                      <input
                        type="color"
                        value={selected.color}
                        onChange={(e) =>
                          updateSelected({ color: e.target.value })
                        }
                      />
                    </div>
                    <label className="v2-range">
                      <span>Line height</span>
                      <input
                        type="range"
                        min="70"
                        max="250"
                        value={selected.lineHeight}
                        onChange={(e) =>
                          updateSelected({ lineHeight: Number(e.target.value) })
                        }
                      />
                      <b>{selected.lineHeight}%</b>
                    </label>
                  </section>
                )}
                <section className="v2-section">
                  <button type="button" className="section-head">
                    <ChevronDown size={16} /> Transform
                  </button>
                  <div className="v2-fields">
                    {ANIMATABLE.map((property) => (
                      <label key={property}>
                        <span
                          className="scrub-label"
                          onPointerDown={(e) => scrub(e, property)}
                        >
                          {property}
                        </span>
                        <input
                          type="number"
                          value={
                            Math.round(selectedDisplay[property] * 10) / 10
                          }
                          onChange={(e) =>
                            updateSelected({
                              [property]: Number(e.target.value),
                            })
                          }
                        />
                        <button
                          type="button"
                          className={
                            (frames[selected.id] ?? []).some(
                              (f) =>
                                f.property === property &&
                                Math.abs(f.time - playhead) < 0.05,
                            )
                              ? "keyed"
                              : ""
                          }
                          onClick={() => addKey(property)}
                        >
                          ◆
                        </button>
                      </label>
                    ))}
                  </div>
                  <p className="scrub-help">
                    Drag a parameter name left or right
                  </p>
                </section>
              </>
            ) : (
              <div className="no-selection">Select a layer to edit</div>
            )}
            <section className="v2-section banner-settings">
              <button type="button" className="section-head">
                <ChevronDown size={16} /> Banner settings
              </button>
              <label>
                Background color
                <input
                  type="color"
                  value={backgrounds[activeFormat]?.color ?? "#ffffff"}
                  onChange={(event) =>
                    setBackgrounds((current) => ({
                      ...current,
                      [activeFormat]: {
                        ...(current[activeFormat] ?? {}),
                        color: event.target.value,
                      },
                    }))
                  }
                />
              </label>
              <div className="background-actions">
                <button
                  type="button"
                  onClick={() => openBackgroundUpload(activeFormat)}
                >
                  <Upload size={14} />{" "}
                  {elements.some(
                    (element) => element.id === `background-${activeFormat}`,
                  )
                    ? "Replace background"
                    : "Upload background"}
                </button>
                {elements.some(
                  (element) => element.id === `background-${activeFormat}`,
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = `background-${activeFormat}`;
                      updateElements((current) =>
                        current.filter((element) => element.id !== id),
                      );
                      setKeyframesByFormat((current) => {
                        const formatFrames = {
                          ...(current[activeFormat] ?? {}),
                        };
                        delete formatFrames[id];
                        return { ...current, [activeFormat]: formatFrames };
                      });
                      if (selectedId === id) setSelectedId(null);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={bannerSettings.borderEnabled}
                  onChange={(event) =>
                    setBannerSettings((current) => ({
                      ...current,
                      borderEnabled: event.target.checked,
                    }))
                  }
                />
                1 px border
                <input
                  type="color"
                  value={bannerSettings.borderColor}
                  disabled={!bannerSettings.borderEnabled}
                  onChange={(event) =>
                    setBannerSettings((current) => ({
                      ...current,
                      borderColor: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={bannerSettings.clickSurface}
                  onChange={(event) =>
                    setBannerSettings((current) => ({
                      ...current,
                      clickSurface: event.target.checked,
                    }))
                  }
                />
                Full-banner click surface
              </label>
              <label className="click-variable">
                <span>Click variable</span>
                <input
                  value={bannerSettings.clickVariable}
                  disabled={!bannerSettings.clickSurface}
                  onChange={(event) =>
                    setBannerSettings((current) => ({
                      ...current,
                      clickVariable: event.target.value,
                    }))
                  }
                />
              </label>
              <small>Profile expects: {platform.click}</small>
              {activeFormat !== "master" &&
                adaptationDecisions[activeFormat]?.length > 0 && (
                  <details>
                    <summary>Adaptation rules applied</summary>
                    {adaptationDecisions[activeFormat].map((decision) => (
                      <p key={`${decision.elementId}-${decision.rule}`}>
                        <b>{decision.rule}</b> — {decision.reason}
                      </p>
                    ))}
                  </details>
                )}
            </section>
          </div>
          <button
            type="button"
            className={`v2-lockbar ${selected?.locked ? "locked" : ""}`}
            disabled={!selected}
            onClick={() => selected && toggleLock(selected.id)}
          >
            {selected?.locked ? <Lock size={16} /> : <Unlock size={16} />}{" "}
            {selected?.locked ? "Layer locked" : "Lock selected layer"}
          </button>
        </aside>
      </div>
      <section className="v2-timeline">
        <header>
          <button
            type="button"
            className="v2-play"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (playhead >= DURATION) setPlayhead(0);
              setPlaying((value) => !value);
            }}
          >
            {playing ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
          </button>
          <button type="button" className="v2-stop" onClick={stop}>
            <Square size={13} fill="currentColor" />
          </button>
          <b>Timeline</b>
          <span>
            {playhead.toFixed(2)} / {DURATION.toFixed(2)}s
          </span>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setPlayhead(0);
            }}
          >
            <RotateCcw size={15} /> Rewind
          </button>
          <div className="tt">
            <div className="easing-control">
              <label>
                Easing{" "}
                <select
                  value={easing}
                  onChange={(event) => {
                    const value = event.target.value as Easing;
                    applyEasing(
                      value,
                      value === "custom" ? bezier : activeBezier,
                    );
                    if (value === "custom") setCurveOpen(true);
                  }}
                >
                  <option value="linear">Linear</option>
                  <option value="ease-in">Ease in</option>
                  <option value="ease-out">Ease out</option>
                  <option value="ease-in-out">Ease in-out</option>
                  <option value="custom">Custom curve</option>
                </select>
              </label>
              <button
                type="button"
                className={`easing-preview ${curveOpen ? "active" : ""}`}
                title="Open cubic-bezier editor"
                aria-label="Open cubic-bezier editor"
                onClick={() => setCurveOpen((open) => !open)}
              >
                <svg viewBox="0 0 48 28" aria-hidden="true">
                  <path d="M4 24H44M4 24V4" />
                  <path
                    className="preview-curve"
                    d={`M4 24C${4 + activeBezier[0] * 40} ${24 - activeBezier[1] * 20},${4 + activeBezier[2] * 40} ${24 - activeBezier[3] * 20},44 4`}
                  />
                </svg>
              </button>
              {curveOpen && (
                <div className="bezier-editor">
                  <BezierEditor
                    value={bezier}
                    onChange={(value) => applyEasing("custom", value as Bezier)}
                    width={350}
                    height={210}
                    padding={[14, 14, 24, 24]}
                    background={theme === "dark" ? "#101110" : "#f6f7f4"}
                    gridColor={theme === "dark" ? "#292c29" : "#dfe2dc"}
                    curveColor={theme === "dark" ? "#48e693" : "#2878ff"}
                    curveWidth={3}
                    handleColor={theme === "dark" ? "#48e693" : "#2878ff"}
                    handleRadius={4}
                    handleStroke={1}
                    progress={playhead / DURATION}
                    progressColor={theme === "dark" ? "#f3a742" : "#e07a21"}
                    textStyle={{
                      fill: theme === "dark" ? "#7f847e" : "#737870",
                      fontSize: 9,
                    }}
                  />
                  <div className="bezier-presets">
                    {EASING_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        className={
                          bezier.every(
                            (value, index) =>
                              Math.abs(value - preset.value[index]) < 0.01,
                          )
                            ? "active"
                            : ""
                        }
                        onClick={() => applyEasing("custom", preset.value)}
                      >
                        <svg viewBox="0 0 54 34" aria-hidden="true">
                          <path
                            d={`M3 31C${3 + preset.value[0] * 48} ${31 - preset.value[1] * 28},${3 + preset.value[2] * 48} ${31 - preset.value[3] * 28},51 3`}
                          />
                        </svg>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="bezier-fields">
                    {bezier.map((value, index) => (
                      <input
                        key={index}
                        aria-label="Bezier control"
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={value}
                        onChange={(event) => {
                          const next = bezier.map((item, itemIndex) =>
                            itemIndex === index
                              ? clamp(Number(event.target.value), 0, 1)
                              : item,
                          ) as Bezier;
                          applyEasing("custom", next);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <select
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
            >
              {platformProfiles.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <span>ZIP limit {platform.maxZip}KB</span>
          </div>
        </header>
        <div
          className="v2-timeline-grid"
          onWheel={zoomTimeline}
          style={{
            gridTemplateColumns: `210px minmax(${700 * timelineZoom}px, 1fr)`,
          }}
        >
          <div className="timeline-label-head">Layers</div>
          <div className="v2-ruler" onPointerDown={seek}>
            {[0, 1, 2, 3, 4, 5, 6].map((t) => (
              <span key={t} style={{ left: `${(t / DURATION) * 100}%` }}>
                {t}s
              </span>
            ))}
            <i
              className="playhead-head"
              style={{ left: `${(playhead / DURATION) * 100}%` }}
            />
          </div>
          {elements
            .slice()
            .reverse()
            .map((e) => (
              <div
                className={`timeline-row ${e.id === selectedId ? "active" : ""}`}
                key={e.id}
              >
                <div className="timeline-layer-cell">
                  <button
                    type="button"
                    title="Previous keyframe"
                    onClick={() => jump(e.id, -1)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className="timeline-layer-name"
                    onClick={() => setSelectedId(e.id)}
                  >
                    {e.locked ? (
                      <Lock size={13} />
                    ) : e.kind === "image" ? (
                      <Image size={13} />
                    ) : (
                      <Type size={13} />
                    )}
                    <span>{e.name}</span>
                  </button>
                  <button
                    type="button"
                    title="Next keyframe"
                    onClick={() => jump(e.id, 1)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <div
                  className="timeline-track"
                  onPointerDown={(event) => {
                    setSelectedId(e.id);
                    seek(event);
                  }}
                >
                  <div className="track-bar" />
                  <i
                    className={`global-playhead ${playheadSnapped ? "snapped" : ""}`}
                    style={{ left: `${(playhead / DURATION) * 100}%` }}
                  />
                  {(frames[e.id] ?? []).map((f) => (
                    <i
                      key={f.id}
                      className={`timeline-key key-${f.property} ${Math.abs(f.time - playhead) < 0.025 ? "active" : ""}`}
                      title={`${f.property}: ${f.value}`}
                      style={{ left: `${(f.time / DURATION) * 100}%` }}
                      onPointerDown={(event) => {
                        setPlayhead(f.time);
                        dragKey(event, e.id, f.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

