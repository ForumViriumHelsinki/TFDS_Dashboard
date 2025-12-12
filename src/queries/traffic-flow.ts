import { queryOptions } from "@tanstack/react-query";
import influxdbQueryApi from "../services/influxdb";

export interface TrafficFlowRequest {
  start: Date;
  end: Date;
  segmentId: string;
}

export type TrafficFlowRow = Record<string, string | number | boolean | null>;

function toFluxTime(value: Date): string {
  return value.toISOString();
}

export const getTrafficFlowQueryOptions = (params: TrafficFlowRequest) =>
  queryOptions({
    queryKey: ["traffic-flow", params],
    queryFn: async () => {
      if (!influxdbQueryApi) {
        throw new Error(
          "InfluxDB is not configured. Please set VITE_INFLUXDB_URL environment variable.",
        );
      }

      const start = toFluxTime(params.start);
      const end = toFluxTime(params.end);
      const segmentId = params.segmentId.replace(/"/g, '\\"');

      const flux = `
from(bucket: "${import.meta.env.VITE_INFLUXDB_BUCKET}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "idea_validation")
  |> filter(fn: (r) => r["_field"] == "segment_closure_status" or r["_field"] == "running_mean" or r["_field"] == "hour_of_day" or r["_field"] == "fcd" or r["_field"] == "day_of_week")
  |> filter(fn: (r) => r["segmentId"] == "${segmentId}")
  |> aggregateWindow(every: 5m, fn: last, createEmpty: false)
  |> sort(columns: ["_time"])
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
`.trim();

      const rows = await influxdbQueryApi.collectRows<TrafficFlowRow>(flux);
      return rows;
    },
  });
