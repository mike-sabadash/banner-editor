import type { TextAnimation, TextCase } from "../model";

export const FRAME_RATE = 30;
export const GRID_STEP = 0.25;
export const MAGNET_PX = 8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function snapTimelineTime(raw: number, duration: number, width: number, extraTargets: number[] = []) {
  const frame = clamp(Math.round(raw * FRAME_RATE) / FRAME_RATE, 0, duration);
  const grid = clamp(Math.round(raw / GRID_STEP) * GRID_STEP, 0, duration);
  const candidates = [grid, ...extraTargets.filter((value) => value >= 0 && value <= duration)];
  const nearest = candidates.reduce((best, value) => Math.abs(value - raw) < Math.abs(best - raw) ? value : best, grid);
  const distancePx = Math.abs(nearest - raw) / duration * Math.max(1, width);
  return distancePx <= MAGNET_PX ? nearest : frame;
}

export function rulerTicks(duration: number) {
  const count = Math.round(duration / GRID_STEP);
  return Array.from({ length: count + 1 }, (_, index) => {
    const time = Number((index * GRID_STEP).toFixed(3));
    const quarter = index % 4;
    return { time, kind: quarter === 0 ? "major" as const : quarter === 2 ? "medium" as const : "minor" as const };
  });
}

export function applyTextCase(text: string, textCase: TextCase = "none") {
  if (textCase === "uppercase") return text.toLocaleUpperCase();
  if (textCase === "lowercase") return text.toLocaleLowerCase();
  if (textCase === "capitalize") return text.replace(/(^|\s)(\p{L})/gu, (_, space, letter) => space + letter.toLocaleUpperCase());
  return text;
}

export function animatedText(text: string, time: number, animation?: TextAnimation) {
  if (!animation || animation.type === "none") return text;
  const speed = Math.max(10, animation.typeSpeed);
  const count = clamp(Math.floor(time * 1000 / speed), 0, text.length);
  const visible = text.slice(0, count);
  const cursor = animation.cursor && count < text.length && Math.floor(time * 2) % 2 === 0 ? "|" : "";
  return visible + cursor;
}
