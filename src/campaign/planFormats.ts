export type PlanPlacement = {
  platform?: string;
  size?: string;
  width?: number;
  height?: number;
  requirements?: {
    maxZipKb?: number | null;
    maxDurationSec?: number | null;
    clickTag?: boolean | null;
    tracking?: boolean | null;
  };
};

export type PlanFormat = {
  id: string;
  width: number;
  height: number;
  size: string;
  family: "Rectangle" | "Vertical" | "Strip";
  platforms: string[];
  placements: PlanPlacement[];
  conflicts: string[];
};

export function normalizePlanSize(input: Partial<PlanPlacement>): { width: number; height: number; size: string } | null {
  let width = Number(input.width) || 0;
  let height = Number(input.height) || 0;
  if ((!width || !height) && input.size) {
    const match = String(input.size).match(/(\d{2,4})\s*[x×х]\s*(\d{2,4})/i);
    if (match) {
      width = Number(match[1]);
      height = Number(match[2]);
    }
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width, height, size: `${width}×${height}` };
}

function familyFor(width: number, height: number): PlanFormat["family"] {
  if (height <= 100 || width / height >= 3) return "Strip";
  if (height > width) return "Vertical";
  return "Rectangle";
}

function detectConflicts(placements: PlanPlacement[]): string[] {
  const conflicts: string[] = [];
  const fields: Array<[keyof NonNullable<PlanPlacement["requirements"]>, string]> = [
    ["maxZipKb", "Max ZIP"],
    ["maxDurationSec", "Duration"],
    ["clickTag", "clickTag"],
    ["tracking", "Tracking"],
  ];
  for (const [field, label] of fields) {
    const values = placements
      .map((p) => p.requirements?.[field])
      .filter((v) => v !== null && v !== undefined);
    if (new Set(values.map(String)).size > 1) conflicts.push(label);
  }
  return conflicts;
}

export function formatsFromPlacements(placements: PlanPlacement[]): PlanFormat[] {
  const map = new Map<string, PlanFormat>();
  for (const placement of placements) {
    const normalized = normalizePlanSize(placement);
    if (!normalized) continue;
    const key = `${normalized.width}x${normalized.height}`;
    let format = map.get(key);
    if (!format) {
      format = {
        id: `format-${key}`,
        width: normalized.width,
        height: normalized.height,
        size: normalized.size,
        family: familyFor(normalized.width, normalized.height),
        platforms: [],
        placements: [],
        conflicts: [],
      };
      map.set(key, format);
    }
    format.placements.push(placement);
    const platform = String(placement.platform || "").trim();
    if (platform && !format.platforms.includes(platform)) format.platforms.push(platform);
  }
  for (const format of map.values()) format.conflicts = detectConflicts(format.placements);
  return [...map.values()];
}
