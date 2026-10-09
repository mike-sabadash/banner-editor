export type ResizeLabLayout = {
  logo: { x: number; y: number; w: number };
  headline: { x: number; y: number; w: number; fontSize: number };
  subline: { x: number; y: number; w: number; fontSize: number; visible: boolean };
  cta: { x: number; y: number; w: number; fontSize: number; visible: boolean };
};

export type ResizeLabCompositionId = "composition-1";

export type ResizeLabComposition = {
  id: ResizeLabCompositionId;
  label: string;
  description: string;
  layouts: {
    portrait: ResizeLabLayout;
    square: ResizeLabLayout;
    landscape: ResizeLabLayout;
  };
};

const composition1: ResizeLabComposition = {
  id: "composition-1",
  label: "Composition 1",
  description: "Logo and copy on the left, CTA anchored to the lower-right safe area.",
  layouts: {
    portrait: {
      logo: { x: 10, y: 8, w: 30 },
      headline: { x: 10, y: 20, w: 76, fontSize: 28 },
      subline: { x: 10, y: 42, w: 70, fontSize: 13, visible: true },
      cta: { x: 55, y: 83, w: 35, fontSize: 12, visible: true },
    },
    square: {
      logo: { x: 8, y: 10, w: 28 },
      headline: { x: 8, y: 25, w: 72, fontSize: 24 },
      subline: { x: 8, y: 48, w: 66, fontSize: 12, visible: true },
      cta: { x: 57, y: 78, w: 35, fontSize: 12, visible: true },
    },
    landscape: {
      logo: { x: 3.3, y: 26.7, w: 15 },
      headline: { x: 3.3, y: 53, w: 39, fontSize: 27 },
      subline: { x: 46, y: 57, w: 23, fontSize: 13, visible: true },
      cta: { x: 75.3, y: 36, w: 21.4, fontSize: 13, visible: true },
    },
  },
};

export const resizeLabCompositions: ResizeLabComposition[] = [composition1];

export function layoutFamily(width: number, height: number): keyof ResizeLabComposition["layouts"] {
  const ratio = width / height;
  if (ratio > 1.25) return "landscape";
  if (ratio < 0.8) return "portrait";
  return "square";
}

export function compositionLayout(
  id: ResizeLabCompositionId,
  width: number,
  height: number,
): ResizeLabLayout {
  const composition = resizeLabCompositions.find(item => item.id === id) ?? composition1;
  return structuredClone(composition.layouts[layoutFamily(width, height)]);
}
