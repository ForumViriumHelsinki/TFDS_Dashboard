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

export interface FloatingCarDataClosestBySegmentRequest {
  start: Date;
  end: Date;
  field: string;
  target: Date;
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

      const rows = await influxdbQueryApi.collectRows<FloatingCarDataRow>(flux);
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

export const getFloatingCarDataClosestBySegmentQueryOptions = (
  params: FloatingCarDataClosestBySegmentRequest,
) =>
  queryOptions({
    queryKey: ["floating-car-data-closest-by-segment", params],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!influxdbQueryApi) {
        throw new Error(
          "InfluxDB is not configured. Please set VITE_INFLUXDB_URL environment variable.",
        );
      }

      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const field = params.field.trim().replace(/"/g, '\\"');
      const targetTs = params.target.getTime();
      const bucket =
        import.meta.env.VITE_INFLUXDB_FCD_BUCKET || "idea-fcd-bucket";

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => r["_field"] == "${field}")
  |> keep(columns: ["segmentId", "_time", "_value"])
`.trim();

      const rows = await influxdbQueryApi.collectRows<FloatingCarDataRow>(flux);

      const closestBySegment = new Map<
        string,
        { value: number; timestamp: Date; distanceMs: number }
      >();

      for (const row of rows) {
        const segmentId = String(row["segmentId"] ?? "").trim();
        if (!segmentId) continue;

        const valueRaw = row["_value"];
        const value =
          typeof valueRaw === "number"
            ? valueRaw
            : Number.parseFloat(String(valueRaw ?? ""));
        if (!Number.isFinite(value)) continue;

        const isoString = String(row["_time"] ?? "");
        const timestamp = new Date(isoString);
        const ts = timestamp.getTime();
        if (!Number.isFinite(ts)) continue;

        const distanceMs = Math.abs(ts - targetTs);
        const current = closestBySegment.get(segmentId);

        if (
          !current ||
          distanceMs < current.distanceMs ||
          (distanceMs === current.distanceMs &&
            ts > current.timestamp.getTime())
        ) {
          closestBySegment.set(segmentId, { value, timestamp, distanceMs });
        }
      }

      return Array.from(closestBySegment.entries()).map(
        ([segmentId, entry]): FloatingCarDataClosestBySegmentRow => ({
          segmentId,
          value: entry.value,
          timestamp: entry.timestamp,
        }),
      );
    },
  });
