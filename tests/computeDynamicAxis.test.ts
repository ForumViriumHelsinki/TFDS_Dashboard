import { describe, it, expect } from "vitest";
import { computeDynamicAxis } from "../src/utils/computeDynamicAxis";

describe("computeDynamicAxis", () => {
  it("produces a sensible range for normal positive data", () => {
    const result = computeDynamicAxis(0, 100);
    expect(result.yMin).toBe(0);
    expect(result.yMax).toBe(100);
    expect(result.ticks.length).toBeGreaterThan(2);
  });

  it("returns a default 0-10 axis when all values are non-positive", () => {
    expect(computeDynamicAxis(0, 0)).toEqual({
      yMin: 0,
      yMax: 10,
      ticks: [0, 2, 4, 6, 8, 10],
    });
  });

  it("does not collapse when min equals max", () => {
    const result = computeDynamicAxis(50, 50);
    expect(result.yMax).toBeGreaterThan(result.yMin);
    expect(result.ticks.length).toBeGreaterThan(1);
  });

  it("does not collapse at the upper bound of relativeSpeed (100%)", () => {
    const result = computeDynamicAxis(100, 100);
    expect(result.yMax).toBeGreaterThan(result.yMin);
    expect(result.ticks.length).toBeGreaterThan(1);
  });

  it("handles negative-only values without collapsing", () => {
    const result = computeDynamicAxis(-5, -5);
    expect(result.yMax).toBeGreaterThan(result.yMin);
  });

  it("handles very small values with appropriate precision and no duplicate ticks", () => {
    const result = computeDynamicAxis(0.01, 0.02);
    expect(result.ticks.length).toBeGreaterThan(1);
    const uniqueTicks = new Set(result.ticks);
    expect(uniqueTicks.size).toBe(result.ticks.length);
  });
});
