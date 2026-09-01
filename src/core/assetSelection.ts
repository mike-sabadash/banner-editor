import type { AssetLibraryItem, Format } from "../model";

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
