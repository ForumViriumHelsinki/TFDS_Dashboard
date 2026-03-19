import { queryOptions } from "@tanstack/react-query";

const DATA_BASE = import.meta.env.VITE_DATA_BASE || "/data";

export interface SegmentSpeedLimitEntry {
  speedLimit: number;
  coverage: number;
  matchedLengthMeters: number;
  segmentLengthMeters: number;
  sourceRecordCount: number;
  method: "sampled-overlap" | "midpoint-fallback";
  fallbackDistanceMeters?: number;
}

export interface SegmentSpeedLimitsJson {
  generatedAt: string;
  source: {
    speedDir: string;
    basenamePrefix: string;
    datasets: Array<{
      name: string;
      recordCount: number;
      validFeatureCount: number;
    }>;
    segmentsPath: string;
    speedRecordCount: number;
    segmentCount: number;
    parameters: Record<string, number>;
  };
  stats: {
    matchedSegments: number;
    unmatchedSegments: number;
    sampledOverlapCount: number;
    fallbackCount: number;
    lowCoverageCount: number;
    unmatchedSampleSegmentIds: string[];
  };
  segmentId: Record<string, SegmentSpeedLimitEntry>;
}

export const getSegmentSpeedLimitsQueryOptions = () =>
  queryOptions({
    queryKey: ["segment-speed-limits"] as const,
    queryFn: async (): Promise<SegmentSpeedLimitsJson> => {
      const res = await fetch(`${DATA_BASE}/segment_speed_limits.json`);
      if (!res.ok) {
        throw new Error("Failed to load segment_speed_limits.json");
      }
      return res.json() as Promise<SegmentSpeedLimitsJson>;
    },
    staleTime: 5 * 60 * 1000,
  });
