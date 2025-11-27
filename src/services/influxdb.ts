import { InfluxDB } from "@influxdata/influxdb-client-browser";

const influxdbQueryApi = new InfluxDB({
  url: import.meta.env.VITE_INFLUXDB_URL,
  token: import.meta.env.VITE_INFLUXDB_TOKEN,
}).getQueryApi(import.meta.env.VITE_INFLUXDB_ORG);

export default influxdbQueryApi;

