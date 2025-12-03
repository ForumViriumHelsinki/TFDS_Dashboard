import { InfluxDB, QueryApi } from "@influxdata/influxdb-client-browser";

const url = import.meta.env.VITE_INFLUXDB_URL;
const token = import.meta.env.VITE_INFLUXDB_TOKEN;
const org = import.meta.env.VITE_INFLUXDB_ORG;

let influxdbQueryApi: QueryApi | null = null;

if (!url) {
  console.error(
    "InfluxDB configuration error: VITE_INFLUXDB_URL is not set. " +
      "Ensure this environment variable is configured at build time."
  );
} else {
  influxdbQueryApi = new InfluxDB({
    url,
    token,
  }).getQueryApi(org);
}

export default influxdbQueryApi;

