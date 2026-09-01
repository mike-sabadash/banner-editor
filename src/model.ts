export type ElementKind =
  | "eyebrow"
  | "headline"
  | "copy"
  | "button"
  | "legal"
  | "image";
export type TextAlign = "left" | "center" | "right" | "justify";
export type TextCase = "none" | "uppercase" | "lowercase" | "capitalize";
export type TextAnimationType = "none" | "typewriter" | "fade" | "rise" | "bounce" | "shake";
export type TextAnimation = { type: TextAnimationType; typeSpeed: number; cursor: boolean; start?: number; duration?: number };
export type AssetLibraryItem = { id:string; name:string; assetUrl:string; width:number; height:number; bytes:number };
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
  textAlign?: TextAlign;
  textCase?: TextCase;
  textSizing?: "auto" | "fixed";
  textAnimation?: TextAnimation;
  inPoint?: number;
  outPoint?: number;
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
  { id: "medium", label: "Medium rectangle", width: 300, height: 250, status: "ready" },
  { id: "half", label: "Half page", width: 300, height: 600, status: "ready" },
  { id: "leader", label: "Leaderboard", width: 728, height: 90, status: "review" },
  { id: "mobile", label: "Mobile banner", width: 320, height: 50, status: "review" },
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
  textAlign: "left",
  textCase: "none",
  textSizing: "fixed",
  inPoint: 0,
  outPoint: 6,
  textAnimation: { type: "none", typeSpeed: 60, cursor: true },
  locked: false,
  visible: true,
});
export const platformProfiles = [
  { id: "google", name: "Google Ads HTML5", maxZip: 150, maxDuration: 30, click: "clickTag", maxFiles: null },
  { id: "yandex", name: "Yandex Direct HTML5", maxZip: 512, maxDuration: 30, click: "Yandex API", maxFiles: 20 },
];
export const fitPreview = (width: number, height: number, maxWidth = 720, maxHeight = 430) => {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
};
export const defaultBannerSettings: BannerSettings = {
  borderEnabled: false,
  borderColor: "#000000",
  clickSurface: true,
  clickVariable: "clickTag",
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const looksLike = (source: BannerElement, pattern: RegExp) => pattern.test(`${source.kind} ${source.name} ${source.text}`.toLowerCase());

export const adaptMasterToFormat = (master: BannerElement[], target: Format) => {
  const masterFormat = formats.find((f) => f.id === "master")!;
  const aspect = target.width / target.height;
  const strip = aspect >= 4;
  const portrait = aspect < 0.8;
  const decisions: AdaptationDecision[] = [];

  const firstLargeImage = master.findIndex((e) => e.kind === "image" && e.width * e.scale / 100 >= 70);
  const elements = master.map((source, index) => {
    const element = { ...source };
    const isBackground = source.kind === "image" && (
      looksLike(source, /background|\bbg\b|фон/) ||
      index === firstLargeImage ||
      (firstLargeImage < 0 && index === 0)
    );
    const isLogo = source.kind === "image" && looksLike(source, /logo|логотип/);
    const isUi = source.kind === "image" && looksLike(source, /ui|interface|screen|widget|panel|card|mobile|onboard/);
    const isIcon = source.kind === "image" && looksLike(source, /icon|shield|badge|икон/);

    if (isBackground) {
      const assumedImageRatio = masterFormat.height / masterFormat.width;
      const coverScale = Math.max(1, (target.height / target.width) / assumedImageRatio);
      const displayW = target.width * coverScale;
      const displayH = target.width * assumedImageRatio * coverScale;
      Object.assign(element, {
        width: 100,
        scale: Math.round(coverScale * 10000) / 100,
        x: ((target.width - displayW) / 2 / target.width) * 100,
        y: ((target.height - displayH) / 2 / target.height) * 100,
      });
      decisions.push({ elementId: source.id, rule: "cover-background", reason: "Background always covers the target; overflow is cropped instead of exposing empty canvas." });
      return element;
    }

    if (strip) {
      const isMobile = target.height <= 60;
      if (isLogo) {
        element.x = 3;
        element.y = isMobile ? 12 : 14;
        element.width = isMobile ? 8 : 10;
        element.scale = 100;
      } else if (isUi) {
        element.x = isMobile ? 76 : 72;
        element.y = isMobile ? 14 : 16;
        element.width = isMobile ? 20 : 24;
        element.scale = 100;
      } else if (isIcon) {
        element.x = isMobile ? 28 : 24;
        element.y = isMobile ? 23 : 35;
        element.width = isMobile ? 4 : 5;
        element.scale = 100;
      } else if (source.kind !== "image") {
        const headline = source.kind === "headline" || looksLike(source, /headline|title|заголов/);
        element.x = headline ? (isMobile ? 14 : 16) : (isMobile ? 30 : 27);
        element.y = headline ? (isMobile ? 12 : 12) : (isMobile ? 48 : 55);
        element.width = headline ? (isMobile ? 58 : 50) : (isMobile ? 40 : 36);
        element.scale = 100;
        element.fontSize = headline ? clamp(Math.round(target.height * 0.22), 11, 22) : clamp(Math.round(target.height * 0.12), 8, 13);
      } else {
        element.width = Math.min(18, source.width);
        element.scale = Math.min(100, source.scale);
      }
      decisions.push({ elementId: source.id, rule: "strip-compose", reason: "Extreme horizontal formats use a compact horizontal composition, not a squeezed desktop layout." });
      return element;
    }

    if (portrait) {
      if (isLogo) {
        element.x = 8;
        element.y = 6;
        element.width = 14;
        element.scale = 100;
      } else if (isUi) {
        element.x = 10;
        element.y = 58;
        element.width = 80;
        element.scale = 100;
      } else if (isIcon) {
        element.x = 9;
        element.y = 39;
        element.width = 6;
        element.scale = 100;
      } else if (source.kind !== "image") {
        const headline = source.kind === "headline" || looksLike(source, /headline|title|заголов/);
        element.x = headline ? 8 : 18;
        element.y = headline ? 18 : 39;
        element.width = headline ? 84 : 72;
        element.scale = 100;
        element.fontSize = headline
          ? clamp(Math.round(Math.min(target.width * 0.15, target.height * 0.09)), 30, 54)
          : clamp(Math.round(Math.min(target.width * 0.08, target.height * 0.045)), 16, 28);
      } else {
        element.x = clamp(source.x, 8, 82);
        element.y = clamp(source.y, 8, 88);
        element.width = Math.min(76, Math.max(18, source.width));
        element.scale = Math.min(100, source.scale);
      }
      decisions.push({ elementId: source.id, rule: "portrait-compose", reason: "Portrait formats are rebuilt as a vertical hierarchy with dedicated logo, copy and UI zones." });
      return element;
    }

    element.x = clamp(source.x, 4, 92);
    element.y = clamp(source.y, 4, 92);
    element.width = Math.min(92, source.width);
    element.scale = Math.min(source.scale, 120);
    if (source.kind !== "image") {
      const headline = source.kind === "headline" || looksLike(source, /headline|title|заголов/);
      const maxFont = headline ? Math.min(target.width * 0.18, target.height * 0.22) : Math.min(target.width * 0.09, target.height * 0.11);
      element.fontSize = Math.min(source.fontSize, Math.max(headline ? 18 : 10, Math.round(maxFont)));
    }
    decisions.push({ elementId: source.id, rule: "rectangle-compose", reason: "Rectangle formats preserve hierarchy while constraining typography and safe areas." });
    return element;
  });
  return { elements, decisions };
};
