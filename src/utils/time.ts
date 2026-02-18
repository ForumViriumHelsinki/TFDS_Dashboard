export const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function floorToFiveMinutes(date: Date): Date {
  const timestamp = date.getTime();
  const floored = Math.floor(timestamp / FIVE_MINUTES_MS) * FIVE_MINUTES_MS;
  return new Date(floored);
}

export function roundToFiveMinutes(date: Date): Date {
  const timestamp = date.getTime();
  const rounded = Math.round(timestamp / FIVE_MINUTES_MS) * FIVE_MINUTES_MS;
  return new Date(rounded);
}

export function getDefaultDateRange(): { start: Date; end: Date } {
  const end = floorToFiveMinutes(new Date());
  const start = new Date(end.getTime() - 12 * 60 * 60 * 1000);
  return { start, end };
}
