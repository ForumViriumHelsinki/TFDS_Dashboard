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

export type FloatingCarDataRow = Record<
  string,
  string | number | boolean | null
>;

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
