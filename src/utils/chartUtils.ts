/**
 * Utility functions for chart time axis calculations
 */

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

export function alignToStepCeil(ts: number, stepMs: number): number {
  return Math.ceil(ts / stepMs) * stepMs;
}

export function generateTimeTicks(minTs?: number, maxTs?: number): number[] {
  if (minTs === undefined || maxTs === undefined || minTs >= maxTs) return [];
  const step = chooseStepMs(maxTs - minTs);
  let t = alignToStepCeil(minTs, step);
  const ticks: number[] = [];
  while (t <= maxTs) {
    ticks.push(t);
    t += step;
  }
  return ticks;
}

export function formatTick(ts: number, rangeMs: number): string {
  const d = new Date(ts);
  if (rangeMs <= 24 * 60 * 60 * 1000) {
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (rangeMs <= 3 * 24 * 60 * 60 * 1000) {
    return d.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}
