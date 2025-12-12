import { InfluxDB, QueryApi } from "@influxdata/influxdb-client-browser";

// Use proxy endpoint instead of direct InfluxDB connection
// This keeps the InfluxDB token server-side for security
const url = "/influxdb-api";
const org = import.meta.env.VITE_INFLUXDB_ORG;

let influxdbQueryApi: QueryApi | null = null;

if (!org) {
  console.error(
    "InfluxDB configuration error: VITE_INFLUXDB_ORG is not set. " +
      "Ensure this environment variable is configured at build time.",
  );
} else {
  // Note: No token needed here - the NGINX/Vite proxy adds it server-side
  influxdbQueryApi = new InfluxDB({
    url,
    // Token is intentionally omitted - added by proxy layer
  }).getQueryApi(org);
}

export default influxdbQueryApi;
