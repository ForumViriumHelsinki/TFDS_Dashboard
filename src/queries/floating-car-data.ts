import { queryOptions } from "@tanstack/react-query";
import influxdbQueryApi from "../services/influxdb";

export interface FloatingCarDataRequest {
  start: Date;
  end: Date;
  segmentId: string;
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
      const segmentId = params.segmentId.replace(/"/g, '\\"');
      const bucket =
        import.meta.env.VITE_INFLUXDB_FCD_BUCKET || "idea-fcd-bucket";

      const flux = `
from(bucket: "${bucket}")
  |> range(start: ${start}, stop: ${end})
  |> filter(fn: (r) => r["_measurement"] == "segment_data")
  |> filter(fn: (r) => r["_field"] == "typical_speed" or r["_field"] == "current_speed" or r["_field"] == "confidence_level" or r["_field"] == "fcd_coverage")
  |> filter(fn: (r) => r["segmentId"] == "${segmentId}")
  |> aggregateWindow(every: 5m, fn: last, createEmpty: false)
  |> sort(columns: ["_time"])
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
`.trim();

      const rows = await influxdbQueryApi.collectRows<FloatingCarDataRow>(flux);
      return rows;
    },
  });
