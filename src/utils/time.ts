export const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * Floors a date down to the nearest 5-minute boundary.
 */
export function floorToFiveMinutes(date: Date): Date {
  const timestamp = date.getTime();
  const floored = Math.floor(timestamp / FIVE_MINUTES_MS) * FIVE_MINUTES_MS;
  return new Date(floored);
}

/**
 * Rounds a date to the nearest 5-minute boundary.
 */
export function roundToFiveMinutes(date: Date): Date {
  const timestamp = date.getTime();
  const rounded = Math.round(timestamp / FIVE_MINUTES_MS) * FIVE_MINUTES_MS;
  return new Date(rounded);
}

/**
 * Parses picker-style input into a valid Date or null.
 * Returns null for empty or invalid values.
 */
export function toDateOrNull(value: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/**
 * Returns the default 12-hour date range ending at the current
 * time floored to a 5-minute boundary.
 */
export function getDefaultDateRange(): { start: Date; end: Date } {
  const end = floorToFiveMinutes(new Date());
  const start = new Date(end.getTime() - 12 * 60 * 60 * 1000);
  return { start, end };
}
