import type { BannerElement, Format } from "../model";

export type LayoutRole = "background" | "logo" | "headline" | "text" | "cta" | "legal" | "image" | "icon" | "ui";
export type ImageDimensions = Record<string, { width: number; height: number }>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function layoutRole(element: BannerElement, index: number, total: number): LayoutRole {
  const hay = `${element.kind} ${element.name} ${element.text}`.toLowerCase();
  if (/logo|логотип/.test(hay) && element.kind === "image") return "logo";
  if (/ui|interface|screen|widget|panel|card|mobile|onboard|404|frame/.test(hay) && element.kind === "image") return "ui";
  if (/icon|shield|badge|икон|щит/.test(hay) && element.kind === "image") return "icon";
  if (element.kind === "image" && (/background|(?:^|\W)bg(?:\W|$)|фон|\d{3,4}[x×_]\d{2,4}/.test(hay) || element.width >= 88 || (index === 0 && total > 1 && element.width >= 70))) return "background";
  if (/legal|disclaimer|terms|услов|18\+/.test(hay) || element.kind === "legal") return "legal";
  if (/cta|button|кноп|купить|подробнее|узнать|перейти/.test(hay) || element.kind === "button") return "cta";
  if (element.kind === "headline" || /headline|title|заголов/.test(hay)) return "headline";
  if (element.kind === "image") return "image";
  return "text";
}

function estimatedHeight(element: BannerElement, format: Format, dimensions: ImageDimensions) {
  const widthPx = element.width / 100 * format.width;
  if (element.kind === "image") {
    const size = dimensions[element.id];
    return widthPx * (size?.width ? size.height / size.width : .65) / format.height * 100;
  }
  const charsPerLine = Math.max(1, Math.floor(widthPx / Math.max(1, element.fontSize * .54)));
  const words = (element.text || " ").split(/\s+/).filter(Boolean);
  let lines = 1, used = 0;
  for (const word of words) {
    const next = used ? used + 1 + word.length : word.length;
    if (next > charsPerLine && used) { lines += 1; used = word.length; }
    else used = next;
  }
  return lines * element.fontSize * element.lineHeight / 100 / format.height * 100;
}

function constrainForeground(element: BannerElement, role: LayoutRole, format: Format, dimensions: ImageDimensions) {
  const ratio = format.width / format.height;
  const strip = ratio >= 4;
  const portrait = ratio < .8;
  const next = { ...element, scale: 100 };
  const widthLimits: Record<LayoutRole, [number, number]> = {
    background: [100, 400], logo: strip ? [4, 15] : [7, 26], headline: strip ? [16, 48] : [24, 90],
    text: strip ? [14, 42] : [20, 88], cta: strip ? [10, 28] : [18, 70], legal: [12, 90],
    image: strip ? [10, 35] : [12, 88], icon: strip ? [2, 8] : [3, 16], ui: strip ? [12, 38] : portrait ? [28, 90] : [22, 82],
  };
  next.width = clamp(next.width, ...widthLimits[role]);
  if (next.kind !== "image") {
    const maxByHeight = role === "headline" ? format.height * (strip ? .38 : portrait ? .095 : .16) : format.height * (strip ? .22 : .075);
    const roleMin = role === "legal" ? 6 : strip ? 7 : 9;
    next.fontSize = clamp(next.fontSize, roleMin, Math.max(roleMin, maxByHeight));
  }
  const height = estimatedHeight(next, format, dimensions);
  next.x = clamp(next.x, 3, Math.max(3, 97 - next.width));
  next.y = clamp(next.y, 4, Math.max(4, 96 - height));
  return next;
}

function intersects(a: BannerElement, b: BannerElement, format: Format, dimensions: ImageDimensions) {
  const ah = estimatedHeight(a, format, dimensions), bh = estimatedHeight(b, format, dimensions);
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + ah, b.y + bh) - Math.max(a.y, b.y);
  return overlapX > Math.min(a.width, b.width) * .08 && overlapY > Math.min(ah, bh) * .12;
}

export function composeLayout(format: Format, source: BannerElement[], dimensions: ImageDimensions = {}) {
  const roles = new Map(source.map((element, index) => [element.id, layoutRole(element, index, source.length)]));
  const prepared = source.map((element) => {
    const role = roles.get(element.id)!;
    if (!element.visible) return { ...element };
    if (role !== "background") return constrainForeground(element, role, format, dimensions);
    const size = dimensions[element.id];
    const imageRatio = size?.width && size?.height ? size.width / size.height : format.width / format.height;
    const targetRatio = format.width / format.height;
    const width = Math.max(100, 100 * imageRatio / targetRatio);
    const height = width * targetRatio / imageRatio;
    return { ...element, x: (100 - width) / 2, y: (100 - height) / 2, width, scale: 100 };
  });

  const strip = format.width / format.height >= 4;
  const placed: BannerElement[] = [];
  return prepared.map((original) => {
    const role = roles.get(original.id)!;
    if (!original.visible || role === "background") return original;
    let next = { ...original };
    for (let attempt = 0; attempt < 5 && placed.some((other) => intersects(next, other, format, dimensions)); attempt += 1) {
      if (strip) next.x += Math.max(3, next.width * .18);
      else next.y += Math.max(3, estimatedHeight(next, format, dimensions) * .28);
      next = constrainForeground(next, role, format, dimensions);
    }
    placed.push(next);
    return next;
  });
}
