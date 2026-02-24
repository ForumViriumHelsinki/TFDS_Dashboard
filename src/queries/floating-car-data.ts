import { queryOptions } from "@tanstack/react-query";
import influxdbQueryApi from "../services/influxdb";
import { segmentMeasurementFieldValues } from "../constants/segment-fields";

export interface FcdBySegmentRequest {
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

const fcdFieldFilter = segmentMeasurementFieldValues
  .map((field) => `r["_field"] == "${field}"`)
  .join(" or ");

function toFluxTime(value: Date): string {
  return value.toISOString();
}

function getInfluxQueryApiOrThrow() {
  if (!influxdbQueryApi) {
    throw new Error(
      "InfluxDB is not configured. Please ensure VITE_INFLUXDB_ORG (and any other required InfluxDB environment variables) are set.",
    );
  }
  return influxdbQueryApi;
}

function getFcdBucket() {
  return import.meta.env.VITE_INFLUXDB_FCD_BUCKET || "idea-fcd-bucket";
}

function escapeFluxString(value: string): string {
  return value.trim().replace(/"/g, '\\"');
}

export const getFcdBySegmentQueryOptions = (
  params: FcdBySegmentRequest,
) =>
  queryOptions({
    queryKey: ["fcd-by-segment", params],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const queryApi = getInfluxQueryApiOrThrow();
      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const bucket = getFcdBucket();

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => ${fcdFieldFilter})
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
      const queryApi = getInfluxQueryApiOrThrow();
      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const segmentId = escapeFluxString(params.segmentId);
      const field = escapeFluxString(params.field);
      const bucket = getFcdBucket();

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

      const rows = await queryApi.collectRows<FloatingCarDataRow>(flux);
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
      const queryApi = getInfluxQueryApiOrThrow();

      const field = escapeFluxString(params.field);
      const startMs = params.start.getTime();
      const endMs = params.end.getTime();
      const targetTs = params.target.getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !Number.isFinite(targetTs)) {
        return [];
      }
      const boundedTargetTs = Math.min(endMs, Math.max(startMs, targetTs));
      const bucket = getFcdBucket();
      const requiredSegmentIds = (params.requiredSegmentIds ?? [])
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
      const requiredSegmentSet = new Set(requiredSegmentIds);
      const hasRequiredSegments = requiredSegmentSet.size > 0;
      const closestBySegment = new Map<
        string,
        { value: number; timestampMs: number; distanceMs: number }
      >();
      const ingestRows = (rows: FloatingCarDataRow[]) => {
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
      if (!(firstWindowStartMs < firstWindowEndMs)) return [];

      const start = toFluxTime(new Date(firstWindowStartMs));
      const end = toFluxTime(new Date(firstWindowEndMs));
      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => r["_field"] == "${field}")
  |> keep(columns: ["segmentId", "_time", "_value"])
`.trim();

      const rows = await queryApi.collectRows<FloatingCarDataRow>(flux);
      ingestRows(rows);

      // In live mode the newest point may be older than +/- 5 minutes. Fall back to
      // the full selected range so segment colors appear as soon as data exists.
      const firstWindowIsNarrowerThanRange =
        firstWindowStartMs > startMs || firstWindowEndMs < endMs;
      if (closestBySegment.size === 0 && firstWindowIsNarrowerThanRange) {
        const fullStart = toFluxTime(new Date(startMs));
        const fullEnd = toFluxTime(new Date(endMs));
        const fullRangeFlux = `
from(bucket: "${bucket}")
  |> range(start: ${fullStart}, stop: ${fullEnd})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => r["_field"] == "${field}")
  |> keep(columns: ["segmentId", "_time", "_value"])
`.trim();
        const fullRangeRows = await queryApi.collectRows<FloatingCarDataRow>(fullRangeFlux);
        ingestRows(fullRangeRows);
      }

      return Array.from(closestBySegment.entries()).map(
        ([segmentId, entry]): FloatingCarDataClosestBySegmentRow => ({
          segmentId,
          value: entry.value,
          timestamp: new Date(entry.timestampMs),
        }),
      );
    },
  });
