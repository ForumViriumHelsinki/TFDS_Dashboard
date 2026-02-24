const SEGMENT_COLOR_STOPS = [
  "#58A7FF",
  "#4452E5",
  "#5322B8",
  "#790DA5",
  "#8B0A7A",
] as const;

export const AIR_QUALITY_COLORS = {
  "Good air quality": "#67E567", // (103,229,103)
  "Satisfactory air quality": "#FFF055", // (255,240,85)
  "Fair air quality": "#FFBB58", // (255,187,88)
  "Poor air quality": "#FE4543", // (254,69,67)
  "Very poor air quality": "#B5468B", // (181,70,139)
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) =>
    Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function interpolateColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  );
}

export function getSegmentGradientCss(): string {
  return `linear-gradient(180deg, ${SEGMENT_COLOR_STOPS[0]} 0%, ${SEGMENT_COLOR_STOPS[1]} 25%, ${SEGMENT_COLOR_STOPS[2]} 50%, ${SEGMENT_COLOR_STOPS[3]} 75%, ${SEGMENT_COLOR_STOPS[4]} 100%)`;
}

export function getAirQualityGradientCss(): string {
  return `linear-gradient(180deg, ${AIR_QUALITY_COLORS["Good air quality"]} 0%, ${AIR_QUALITY_COLORS["Satisfactory air quality"]} 25%, ${AIR_QUALITY_COLORS["Fair air quality"]} 50%, ${AIR_QUALITY_COLORS["Poor air quality"]} 75%, ${AIR_QUALITY_COLORS["Very poor air quality"]} 100%)`;
}

export function getAirQualityColor(index?: number): string {
  if (index === undefined || index === null) return "#7e7e7e";
  if (index <= 50) return AIR_QUALITY_COLORS["Good air quality"];
  if (index <= 75) return AIR_QUALITY_COLORS["Satisfactory air quality"];
  if (index <= 100) return AIR_QUALITY_COLORS["Fair air quality"];
  if (index <= 150) return AIR_QUALITY_COLORS["Poor air quality"];
  return AIR_QUALITY_COLORS["Very poor air quality"];
}

export function getSegmentColorForValue(
  value: number,
  maxValue: number,
  minValue = 0,
): string {
  if (!Number.isFinite(value) || !Number.isFinite(maxValue) || maxValue <= minValue) {
    return SEGMENT_COLOR_STOPS[2];
  }

  const normalized = 1 - clamp((value - minValue) / (maxValue - minValue), 0, 1);
  const lastIndex = SEGMENT_COLOR_STOPS.length - 1;
  const position = normalized * lastIndex;
  const index = Math.floor(position);
  const nextIndex = Math.min(index + 1, lastIndex);
  const localT = position - index;

  return interpolateColor(
    SEGMENT_COLOR_STOPS[index],
    SEGMENT_COLOR_STOPS[nextIndex],
    localT,
  );
}
