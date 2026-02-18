import { queryOptions } from "@tanstack/react-query";
import influxdbQueryApi from "../services/influxdb";
import { segmentMeasurementFieldValues } from "../constants/segment-fields";

export interface FloatingCarDataAllFieldsBySegmentRequest {
  start: Date;
  end: Date;
}

export interface FloatingCarDataTimeSeriesRequest {
  start: Date;
  end: Date;
  segmentId: string;
  field: string;
}

export interface FloatingCarDataNearestBySegmentRequest {
  start: Date;
  end: Date;
  field: string;
  target: Date;
  requiredSegmentIds?: string[];
}

export type FloatingCarDataRow = Record<
  string,
  string | number | boolean | null
>;

export interface FloatingCarDataClosestBySegmentRow {
  segmentId: string;
  value: number;
  timestamp: Date;
}

function toFluxTime(value: Date): string {
  return value.toISOString();
}

export const getFloatingCarDataAllFieldsBySegmentQueryOptions = (
  params: FloatingCarDataAllFieldsBySegmentRequest,
) =>
  queryOptions({
    queryKey: ["floating-car-data-all-fields-by-segment", params],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!influxdbQueryApi) {
        throw new Error(
          "InfluxDB is not configured. Please set VITE_INFLUXDB_URL environment variable.",
        );
      }
      const queryApi = influxdbQueryApi;

      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const bucket =
        import.meta.env.VITE_INFLUXDB_FCD_BUCKET || "idea-fcd-bucket";
      const fieldFilter = segmentMeasurementFieldValues
        .map((field) => `r["_field"] == "${field}"`)
        .join(" or ");

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => ${fieldFilter})
  |> group(columns: ["segmentId", "_field"])
  |> last()
  |> keep(columns: ["segmentId", "_field", "_value"])
  |> group()
  |> pivot(rowKey: ["segmentId"], columnKey: ["_field"], valueColumn: "_value")
`.trim();

      const rows = await queryApi.collectRows<FloatingCarDataRow>(flux);
      return rows;
    },
  });

export const getFloatingCarDataTimeSeriesQueryOptions = (
  params: FloatingCarDataTimeSeriesRequest,
) =>
  queryOptions({
    queryKey: ["floating-car-data-time-series", params],
    queryFn: async () => {
      if (!influxdbQueryApi) {
        throw new Error(
          "InfluxDB is not configured. Please set VITE_INFLUXDB_URL environment variable.",
        );
      }

      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const segmentId = params.segmentId.trim().replace(/"/g, '\\"');
      const field = params.field.trim().replace(/"/g, '\\"');
      const bucket =
        import.meta.env.VITE_INFLUXDB_FCD_BUCKET || "idea-fcd-bucket";

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => r["_field"] == "${field}")
  |> filter(fn: (r) => r["segmentId"] == "${segmentId}")
  |> aggregateWindow(every: 5m, fn: last, createEmpty: false)
  |> sort(columns: ["_time"])
  |> keep(columns: ["_time", "_value", "segmentId"])
`.trim();

      const rows = await influxdbQueryApi.collectRows<FloatingCarDataRow>(flux);
      return rows;
    },
  });

export const getFloatingCarDataNearestBySegmentQueryOptions = (
  params: FloatingCarDataNearestBySegmentRequest,
) =>
  queryOptions({
    queryKey: ["floating-car-data-nearest-by-segment", params],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!influxdbQueryApi) {
        throw new Error(
          "InfluxDB is not configured. Please set VITE_INFLUXDB_URL environment variable.",
        );
      }
      const queryApi = influxdbQueryApi;

      const field = params.field.trim().replace(/"/g, '\\"');
      const startMs = params.start.getTime();
      const endMs = params.end.getTime();
      const targetTs = params.target.getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !Number.isFinite(targetTs)) {
        return [];
      }
      const boundedTargetTs = Math.min(endMs, Math.max(startMs, targetTs));
      const bucket =
        import.meta.env.VITE_INFLUXDB_FCD_BUCKET || "idea-fcd-bucket";
      const requiredSegmentIds = (params.requiredSegmentIds ?? [])
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
      const requiredSegmentSet = new Set(requiredSegmentIds);
      const hasRequiredSegments = requiredSegmentSet.size > 0;
      const closestBySegment = new Map<
        string,
        { value: number; timestampMs: number; distanceMs: number }
      >();

      const collectRange = async (rangeStartMs: number, rangeEndMs: number) => {
        if (!(rangeStartMs < rangeEndMs)) return;

        const start = toFluxTime(new Date(rangeStartMs));
        const end = toFluxTime(new Date(rangeEndMs));
        const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => r["_field"] == "${field}")
  |> keep(columns: ["segmentId", "_time", "_value"])
`.trim();

        const rows = await queryApi.collectRows<FloatingCarDataRow>(flux);

        for (const row of rows) {
          const segmentId = String(row["segmentId"] ?? "").trim();
          if (!segmentId) continue;
          if (hasRequiredSegments && !requiredSegmentSet.has(segmentId)) continue;

          const valueRaw = row["_value"];
          const value =
            typeof valueRaw === "number"
              ? valueRaw
              : Number.parseFloat(String(valueRaw ?? ""));
          if (!Number.isFinite(value)) continue;

          const ts = new Date(String(row["_time"] ?? "")).getTime();
          if (!Number.isFinite(ts)) continue;

          const distanceMs = Math.abs(ts - boundedTargetTs);
          const current = closestBySegment.get(segmentId);
          if (
            !current ||
            distanceMs < current.distanceMs ||
            (distanceMs === current.distanceMs && ts > current.timestampMs)
          ) {
            closestBySegment.set(segmentId, { value, timestampMs: ts, distanceMs });
          }
        }
      };

      const firstWindowMs = 5 * 60 * 1000;
      const firstWindowStartMs = Math.max(startMs, boundedTargetTs - firstWindowMs);
      const firstWindowEndMs = Math.min(endMs, boundedTargetTs + firstWindowMs);

      // Single strict window around selected moment. No widening.
      await collectRange(firstWindowStartMs, firstWindowEndMs);

      return Array.from(closestBySegment.entries()).map(
        ([segmentId, entry]): FloatingCarDataClosestBySegmentRow => ({
          segmentId,
          value: entry.value,
          timestamp: new Date(entry.timestampMs),
        }),
      );
    },
  });
