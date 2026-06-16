/**
 * Compute a "nice" Y-axis range and tick set for a series whose min and
 * max are known. Used by TrafficFlowChart when the configured yMax does
 * not apply (e.g. the unbounded "Suhteellinen nopeus" view).
 *
 * When all observed values are non-positive, returns a default 0-10 axis.
 * When `min === max`, pads the value so recharts can render a non-zero-
 * height plot area.
 */
export function computeDynamicAxis(
  minDataValue: number,
  maxDataValue: number,
): { yMin: number; yMax: number; ticks: number[] } {
  if (maxDataValue <= 0 && minDataValue >= 0)
    return { yMin: 0, yMax: 10, ticks: [0, 2, 4, 6, 8, 10] };

  if (maxDataValue === minDataValue) {
    const pad = Math.max(Math.abs(maxDataValue) * 0.1, 1);
    minDataValue -= pad;
    maxDataValue += pad;
  }

  const yMin = minDataValue;
  const yMax = maxDataValue;

  const range = yMax - yMin;
  const roughStep = range / 5 || 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;

  let niceStep: number;
  if (normalized <= 1) niceStep = magnitude;
  else if (normalized <= 2) niceStep = 2 * magnitude;
  else if (normalized <= 5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const ticks: number[] = [];
  const tickStart = Math.ceil(yMin / niceStep) * niceStep;
  // Round to the precision implied by niceStep so sub-0.01 steps don't
  // collapse into duplicate ticks.
  const precision = Math.max(0, -Math.floor(Math.log10(niceStep)));
  const factor = Math.pow(10, precision);
  for (let v = tickStart; v <= yMax + niceStep * 0.01; v += niceStep) {
    ticks.push(Math.round(v * factor) / factor);
  }

  return { yMin, yMax, ticks };
}
