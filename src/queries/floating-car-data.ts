import { queryOptions } from "@tanstack/react-query";
import influxdbQueryApi from "../services/influxdb";

export interface FloatingCarDataRequest {
  start: Date;
  end: Date;
  segmentId: string;
}

export interface FloatingCarDataAvailableFieldsRequest {
  start: Date;
  end: Date;
}

export interface FloatingCarDataFieldBySegmentRequest {
  start: Date;
  end: Date;
  field: string;
}

export interface FloatingCarDataTimeSeriesRequest {
  start: Date;
  end: Date;
  segmentId: string;
  field: string;
}

export type FloatingCarDataRow = Record<
  string,
  string | number | boolean | null
>;

function toFluxTime(value: Date): string {
  return value.toISOString();
}

export const getFloatingCarDataQueryOptions = (
  params: FloatingCarDataRequest,
) =>
  queryOptions({
    queryKey: ["floating-car-data", params],
    queryFn: async () => {
      if (!influxdbQueryApi) {
        throw new Error(
          "InfluxDB is not configured. Please set VITE_INFLUXDB_URL environment variable.",
        );
      }

      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const segmentId = params.segmentId.trim().replace(/"/g, '\\"');
      const segmentIdFilter =
        segmentId.length > 0
          ? `\n  |> filter(fn: (r) => r["segmentId"] == "${segmentId}")`
          : "";
      const bucket =
        import.meta.env.VITE_INFLUXDB_FCD_BUCKET || "idea-fcd-bucket";

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => r["_field"] == "typicalSpeed" or r["_field"] == "currentSpeed" or r["_field"] == "confidence_level" or r["_field"] == "fcd_coverage")
  ${segmentIdFilter}
  |> aggregateWindow(every: 5m, fn: last, createEmpty: false)
  |> sort(columns: ["_time"])
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
`.trim();

      const rows = await influxdbQueryApi.collectRows<FloatingCarDataRow>(flux);
      return rows;
    },
  });

export const getFloatingCarDataAvailableFieldsQueryOptions = (
  params: FloatingCarDataAvailableFieldsRequest,
) =>
  queryOptions({
    queryKey: ["floating-car-data-available-fields", params],
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

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> keep(columns: ["_field"])
  |> group()
  |> distinct(column: "_field")
  |> sort(columns: ["_field"])
`.trim();

      const rows = await influxdbQueryApi.collectRows<FloatingCarDataRow>(flux);
      return rows;
    },
  });

export const getFloatingCarDataFieldBySegmentQueryOptions = (
  params: FloatingCarDataFieldBySegmentRequest,
) =>
  queryOptions({
    queryKey: ["floating-car-data-field-by-segment", params],
    queryFn: async () => {
      if (!influxdbQueryApi) {
        throw new Error(
          "InfluxDB is not configured. Please set VITE_INFLUXDB_URL environment variable.",
        );
      }

      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const field = params.field.trim().replace(/"/g, '\\"');
      const bucket =
        import.meta.env.VITE_INFLUXDB_FCD_BUCKET || "idea-fcd-bucket";

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => r["_field"] == "${field}")
  |> group(columns: ["segmentId"])
  |> last()
  |> keep(columns: ["_time", "_value", "segmentId"])
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
