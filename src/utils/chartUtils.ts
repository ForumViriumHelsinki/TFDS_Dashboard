export function chooseStepMs(totalRangeMs: number): number {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const candidates = [
    5 * minute,
    15 * minute,
    30 * minute,
    1 * hour,
    2 * hour,
    3 * hour,
    6 * hour,
    12 * hour,
    1 * day,
    2 * day,
  ];
  const maxLabels = 8;
  for (const step of candidates) {
    if (totalRangeMs / step <= maxLabels) return step;
  }
  return 7 * day;
}

export function alignToStepCeil(timestamp: number, stepMs: number): number {
  return Math.ceil(timestamp / stepMs) * stepMs;
}

export function generateTimeTicks(
  minTimestamp?: number,
  maxTimestamp?: number,
): number[] {
  if (
    minTimestamp === undefined ||
    maxTimestamp === undefined ||
    minTimestamp >= maxTimestamp
  )
    return [];
  const step = chooseStepMs(maxTimestamp - minTimestamp);
  let currentTimestamp = alignToStepCeil(minTimestamp, step);
  const ticks: number[] = [];
  while (currentTimestamp <= maxTimestamp) {
    ticks.push(currentTimestamp);
    currentTimestamp += step;
  }
  return ticks;
}

export function formatTick(timestamp: number, rangeMs: number): string {
  const date = new Date(timestamp);
  if (rangeMs <= 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (rangeMs <= 3 * 24 * 60 * 60 * 1000) {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
    });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}
