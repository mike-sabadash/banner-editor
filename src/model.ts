export type ElementKind =
  | "eyebrow"
  | "headline"
  | "copy"
  | "button"
  | "legal"
  | "image";
export type BannerElement = {
  id: string;
  kind: ElementKind;
  name: string;
  text: string;
  assetUrl?: string;
  x: number;
  y: number;
  width: number;
  scale: number;
  rotation: number;
  opacity: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  locked: boolean;
  visible: boolean;
};
export type Format = {
  id: string;
  label: string;
  width: number;
  height: number;
  status: "master" | "ready" | "review";
};
export type AdaptationDecision = {
  elementId: string;
  rule: string;
  reason: string;
};
export type BannerSettings = {
  borderEnabled: boolean;
  borderColor: string;
  clickSurface: boolean;
  clickVariable: string;
};
export const formats: Format[] = [
  { id: "master", label: "Master", width: 1200, height: 628, status: "master" },
  {
    id: "medium",
    label: "Medium rectangle",
    width: 300,
    height: 250,
    status: "ready",
  },
  { id: "half", label: "Half page", width: 300, height: 600, status: "ready" },
  {
    id: "leader",
    label: "Leaderboard",
    width: 728,
    height: 90,
    status: "review",
  },
  {
    id: "mobile",
    label: "Mobile banner",
    width: 320,
    height: 50,
    status: "review",
  },
];
export const initialElements: BannerElement[] = [];
export const createTextElement = (
  kind: Exclude<ElementKind, "image"> = "headline",
): BannerElement => ({
  id: `text-${crypto.randomUUID()}`,
  kind,
  name: kind === "headline" ? "Headline" : "Text",
  text: kind === "headline" ? "Headline" : "Text",
  x: 10,
  y: 10,
  width: 45,
  scale: 100,
  rotation: 0,
  opacity: 100,
  fontFamily: "Manrope",
  fontSize: kind === "headline" ? 48 : 18,
  lineHeight: 110,
  color: "#1f211d",
  locked: false,
  visible: true,
});
export const platformProfiles = [
  {
    id: "google",
    name: "Google Ads HTML5",
    maxZip: 150,
    maxDuration: 30,
    click: "clickTag",
    maxFiles: null,
  },
  {
    id: "yandex",
    name: "Yandex Direct HTML5",
    maxZip: 512,
    maxDuration: 30,
    click: "Yandex API",
    maxFiles: 20,
  },
];
export const fitPreview = (
  width: number,
  height: number,
  maxWidth = 720,
  maxHeight = 430,
) => {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
};
export const defaultBannerSettings: BannerSettings = {
  borderEnabled: false,
  borderColor: "#000000",
  clickSurface: true,
  clickVariable: "clickTag",
};
export const adaptMasterToFormat = (
  master: BannerElement[],
  target: Format,
) => {
  const aspect = target.width / target.height,
    strip = aspect >= 4,
    portrait = aspect < 0.8;
  const decisions: AdaptationDecision[] = [];
  const elements = master.map((source, index) => {
    const element = { ...source };
    const isBackground =
      source.kind === "image" && (source.width >= 80 || index === 0);
    if (isBackground) {
      Object.assign(element, { x: 0, y: 0, width: 100, scale: 100 });
      decisions.push({
        elementId: source.id,
        rule: "cover-background",
        reason:
          "Large image fills the target artboard and remains behind the composition.",
      });
      return element;
    }
    if (strip) {
      element.y = Math.max(12, Math.min(58, source.y * 0.55));
      element.width = Math.min(source.kind === "image" ? 32 : 42, source.width);
      element.scale = Math.min(source.scale, 82);
      if (source.kind !== "image")
        element.fontSize = Math.max(10, Math.round(source.fontSize * 0.58));
      decisions.push({
        elementId: source.id,
        rule: "strip-reflow",
        reason:
          "Wide, shallow formats compress vertical rhythm and reduce secondary scale.",
      });
    } else if (portrait) {
      element.x = Math.max(8, Math.min(82, 8 + (source.x / 100) * 72));
      element.y = Math.max(6, Math.min(88, source.y));
      element.width = Math.min(
        source.kind === "image" ? 76 : 84,
        Math.max(28, source.width * 1.08),
      );
      element.scale = Math.min(source.scale, 95);
      decisions.push({
        elementId: source.id,
        rule: "portrait-stack",
        reason:
          "Portrait formats use a wider single-column stack with safe side margins.",
      });
    } else {
      element.x = Math.max(4, Math.min(92, source.x));
      element.y = Math.max(4, Math.min(92, source.y));
      element.width = Math.min(92, source.width);
      decisions.push({
        elementId: source.id,
        rule: "normalized-position",
        reason:
          "Rectangle format preserves master-relative placement inside safe bounds.",
      });
    }
    return element;
  });
  return { elements, decisions };
};
