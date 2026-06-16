/* eslint-env node */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only upload source maps in production builds when auth token is available
    process.env.SENTRY_AUTH_TOKEN &&
      sentryVitePlugin({
        org: "forum-virium-helsinki",
        project: "tfds_dashboard",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        telemetry: false,
      }),
  ].filter(Boolean),
  server: {
    proxy: {
      "/hsy-wfs": {
        target: "https://kartta.hsy.fi",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hsy-wfs/, ""),
      },
      "/hel-wfs": {
        target: "https://kartta.hel.fi",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hel-wfs/, ""),
      },
      "/feature-flags": {
        target: "http://localhost:1031",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/feature-flags/, ""),
      },
      "/influxdb-api": {
        target: (() => {
          const host =
            process.env.VITE_INFLUXDB_HOST ||
            "idea-helsinki-influxdb.dataportal.fi";
          const protocol =
            host.startsWith("localhost:") || !host.includes(".")
              ? "http"
              : "https";
          return `${protocol}://${host}`;
        })(),
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/influxdb-api/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Add InfluxDB token to all proxied requests
            const token = process.env.INFLUXDB_TOKEN;
            if (token) {
              proxyReq.setHeader("Authorization", `Token ${token}`);
            } else {
              console.warn(
                "⚠️  INFLUXDB_TOKEN not set - InfluxDB API calls will fail",
              );
            }
          });
        },
      },
    },
  },
  build: {
    sourcemap: true, // Generate source maps for Sentry
  },
});
