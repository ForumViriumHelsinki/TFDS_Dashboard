import { queryOptions } from "@tanstack/react-query";
import influxdbQueryApi from "../services/influxdb";

export interface AqiTimeSeriesRequest {
  start: Date;
  end: Date;
  stationName: string;
}

export type AqiTimeSeriesRow = Record<string, string | number | boolean | null>;

function toFluxTime(value: Date): string {
  return value.toISOString();
}

function getInfluxQueryApiOrThrow() {
  if (!influxdbQueryApi) {
    throw new Error(
      "InfluxDB is not configured. Please set VITE_INFLUXDB_ORG environment variable.",
    );
  }
  return influxdbQueryApi;
}

function getAqiBucket() {
  return import.meta.env.VITE_INFLUXDB_AQI_BUCKET || "idea-tfds-aqi";
}

function escapeFluxString(value: string): string {
  return value.trim().replace(/"/g, '\\"');
}

export const getAqiTimeSeriesByStationQueryOptions = (
  params: AqiTimeSeriesRequest,
) =>
  queryOptions({
    queryKey: ["aqi-time-series", params],
    queryFn: async () => {
      const queryApi = getInfluxQueryApiOrThrow();
      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const stationName = escapeFluxString(params.stationName);
      const bucket = getAqiBucket();

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "aqi")
  |> filter(fn: (r) => r["_field"] == "aqi")
  |> filter(fn: (r) => r["stationName"] == "${stationName}")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> group(columns: ["_time"])
  |> mean(column: "_value")
  |> sort(columns: ["_time"])
  |> keep(columns: ["_time", "_value"])
`.trim();

      const rows = await queryApi.collectRows<AqiTimeSeriesRow>(flux);
      return rows;
    },
  });
