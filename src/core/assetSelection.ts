import type { AssetLibraryItem, BannerElement, Format } from "../model";

const backgroundName = /(?:^|[-_.\s])(bg|background|backdrop|canvas|wallpaper|base|hero|фон|подложка)(?:$|[-_.\s])/i;
const foregroundName = /(?:^|[-_.\s])(logo|icon|ui|interface|frame|product|button|badge|shield|логотип|икон|кноп|щит)(?:$|[-_.\s])/i;
const mentions = (name: string, value: number) => new RegExp(`(?:^|\\D)${value}(?:\\D|$)`).test(name);

const sizeWords = (format: Format) => {
  const area = format.width * format.height;
  if (area <= 45_000) return /(?:^|[-_.\s])(small|size[-_.\s]?s|sm)(?:$|[-_.\s])/i;
  if (area <= 200_000) return /(?:^|[-_.\s])(medium|size[-_.\s]?m|md)(?:$|[-_.\s])/i;
  return /(?:^|[-_.\s])(large|size[-_.\s]?l|lg)(?:$|[-_.\s])/i;
};

export function scoreAssetForFormat(asset: AssetLibraryItem, format: Format) {
  const name = asset.name.toLowerCase();
  const exact = new RegExp(`(?:^|\\D)${format.width}\\s*[x×_-]\\s*${format.height}(?:\\D|$)`, "i").test(name);
  const assetRatio = asset.width > 0 && asset.height > 0 ? asset.width / asset.height : 1;
  const ratioDistance = Math.abs(Math.log(assetRatio / (format.width / format.height)));
  const dimensionFit = asset.width >= format.width && asset.height >= format.height ? 14 : -12;
  const excessivePixels = Math.max(1, asset.width * asset.height) / Math.max(1, format.width * format.height);
  const weightPenalty = Math.log2(Math.max(1, asset.bytes / 65_536)) * 4;
  return (exact ? 120 : 0) + (sizeWords(format).test(name) ? 26 : 0) + dimensionFit - ratioDistance * 52 - Math.max(0, excessivePixels - 2) * 2 - weightPenalty;
}

export function selectAssetCandidates(assets: AssetLibraryItem[], format: Format, limit = 8) {
  return [...assets]
    .filter((asset) => asset.assetUrl && asset.width > 0 && asset.height > 0)
    .sort((a, b) => scoreAssetForFormat(b, format) - scoreAssetForFormat(a, format))
    .slice(0, limit);
}

export function selectBackgroundAsset(assets: AssetLibraryItem[], format: Format) {
  const candidates = assets.filter((asset) => {
    if (!asset.assetUrl || foregroundName.test(asset.name)) return false;
    const exactPixels = asset.width === format.width && asset.height === format.height;
    const ratio = asset.width > 0 && asset.height > 0 ? asset.width / asset.height : 0;
    const closeRatio = ratio > 0 && Math.abs(Math.log(ratio / (format.width / format.height))) < .16;
    return backgroundName.test(asset.name) || exactPixels || (closeRatio && mentions(asset.name, format.width));
  });
  return [...candidates].sort((a, b) => {
    const intent = (asset: AssetLibraryItem) => {
      const name = asset.name.toLowerCase();
      const exactPixels = asset.width === format.width && asset.height === format.height;
      return scoreAssetForFormat(asset, format)
        + (exactPixels ? 180 : 0)
        + (backgroundName.test(name) ? 70 : 0)
        + (mentions(name, format.width) ? 24 : 0)
        + (mentions(name, format.height) ? 16 : 0);
    };
    return intent(b) - intent(a);
  })[0];
}

export function applyBackgroundAsset(elements: BannerElement[], asset?: AssetLibraryItem) {
  if (!asset) return elements;
  let replaced = false;
  return elements.map((element) => {
    const looksLikeBackground = element.kind === "image" && (
      backgroundName.test(element.name) || element.width >= 88
    );
    if (replaced || !looksLikeBackground) return element;
    replaced = true;
    return {
      ...element,
      name: asset.name,
      assetUrl: asset.assetUrl,
      x: 0,
      y: 0,
      width: 100,
      scale: 100,
      rotation: 0,
      opacity: 100,
      visible: true,
    };
  });
}
