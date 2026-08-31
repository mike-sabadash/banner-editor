import BezierEasing from "bezier-easing";

export type AnimatableProperty = "x" | "y" | "scale" | "rotation" | "opacity";
export type Easing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "custom";
export type Bezier = [number, number, number, number];
export type Keyframe = {
  id: string;
  time: number;
  property: AnimatableProperty;
  value: number;
  easing?: Easing;
  bezier?: Bezier;
};
export type FormatKeyframes = Record<string, Keyframe[]>;
export const upsertKeyframe = (frames: Keyframe[], frame: Keyframe) =>
  [
    ...frames.filter(
      (item) =>
        !(
          item.property === frame.property &&
          Math.abs(item.time - frame.time) < 0.05
        ),
    ),
    frame,
  ].sort((a, b) => a.time - b.time);
export const moveKeyframe = (frames: Keyframe[], id: string, time: number) =>
  frames
    .map((item) =>
      item.id === id ? { ...item, time: Math.max(0, Math.min(6, time)) } : item,
    )
    .sort((a, b) => a.time - b.time);
export const cubicBezierProgress = (value: number, [x1, y1, x2, y2]: Bezier) =>
  BezierEasing(x1, y1, x2, y2)(Math.max(0, Math.min(1, value)));
export const easeProgress = (
  value: number,
  easing: Easing = "linear",
  bezier: Bezier = [0.42, 0, 0.58, 1],
) => {
  const t = Math.max(0, Math.min(1, value));
  if (easing === "custom") return cubicBezierProgress(t, bezier);
  if (easing === "ease-in") return cubicBezierProgress(t, [0.42, 0, 1, 1]);
  if (easing === "ease-out") return cubicBezierProgress(t, [0, 0, 0.58, 1]);
  if (easing === "ease-in-out")
    return cubicBezierProgress(t, [0.42, 0, 0.58, 1]);
  return t;
};
export const interpolateValue = (
  baseValue: number,
  frames: Array<Keyframe | null | undefined>,
  property: AnimatableProperty,
  playhead: number,
) => {
  const time = Number.isFinite(playhead)
    ? Math.max(0, Math.min(6, playhead))
    : 0;
  const valid = frames
    .filter(
      (frame): frame is Keyframe =>
        Boolean(frame) &&
        frame!.property === property &&
        Number.isFinite(frame!.time) &&
        Number.isFinite(frame!.value),
    )
    .sort((a, b) => a.time - b.time);
  if (!valid.length) return baseValue;
  const before = [{ time: 0, value: baseValue }, ...valid]
    .filter((frame) => frame.time <= time)
    .at(-1) ?? { time: 0, value: baseValue };
  const after = valid.find((frame) => frame.time >= time);
  if (!after || after.time === before.time) return before.value;
  const progress = easeProgress(
    (time - before.time) / (after.time - before.time),
    after.easing,
    after.bezier,
  );
  return before.value + (after.value - before.value) * progress;
};
export const snapTimelineTime = (
  value: number,
  candidates: number[] = [],
  step = 0.1,
  threshold = 0.07,
) => {
  if (!Number.isFinite(value)) return 0;
  const clamped = Math.max(0, Math.min(6, value));
  const anchors = [0, 6, ...candidates];
  const nearest = anchors.reduce(
    (best, item) =>
      Math.abs(item - clamped) < Math.abs(best - clamped) ? item : best,
    anchors[0],
  );
  return Math.abs(nearest - clamped) <= threshold
    ? nearest
    : Number((Math.round(clamped / step) * step).toFixed(4));
};
export const setEasingAtTime = (
  frames: Keyframe[],
  time: number,
  easing: Easing,
  bezier: Bezier,
) => {
  const exact = frames.find((frame) => Math.abs(frame.time - time) < 0.055);
  const target =
    exact ??
    [...frames]
      .sort((a, b) => a.time - b.time)
      .find((frame) => frame.time > time);
  if (!target) return frames;
  return frames.map((frame) =>
    frame.id === target.id
      ? { ...frame, easing, bezier: [...bezier] as Bezier }
      : frame,
  );
};
