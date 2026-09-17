export type LevelColor =
  | "levelGray"
  | "levelWhite"
  | "levelLightBlue"
  | "levelBlue"
  | "levelDarkBlue";

export const LEVELS = [
  { level: 1, min: 0, max: 99, color: "levelGray" },
  { level: 2, min: 100, max: 249, color: "levelGray" },
  { level: 3, min: 250, max: 499, color: "levelWhite" },
  { level: 4, min: 500, max: 749, color: "levelLightBlue" },
  { level: 5, min: 750, max: 999, color: "levelBlue" },
  { level: 6, min: 1000, max: 1249, color: "levelBlue" },
  { level: 7, min: 1250, max: 1499, color: "levelBlue" },
  { level: 8, min: 1500, max: 1749, color: "levelDarkBlue" },
  { level: 9, min: 1750, max: 1999, color: "levelDarkBlue" },
  { level: 10, min: 2000, max: Infinity, color: "levelDarkBlue" },
] as const;

export function getLevelInfo(ep: number) {
  const safeEp = Number.isFinite(ep) ? Math.max(0, ep) : 0;

  const current =
    LEVELS.find((item) => safeEp >= item.min && safeEp <= item.max) ??
    LEVELS[0];

  const progress =
    current.max === Infinity
      ? 100
      : ((safeEp - current.min) / (current.max - current.min)) * 100;

  return {
    level: current.level,
    min: current.min,
    max: current.max,
    color: current.color,
    progress: Math.max(0, Math.min(100, progress)),
    ep: safeEp,
  };
}