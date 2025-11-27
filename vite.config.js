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
      '/hsy-wfs': {
        target: 'https://kartta.hsy.fi',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hsy-wfs/, ''),
      },
      '/hel-wfs': {
        target: 'https://kartta.hel.fi',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/hel-wfs/, ''),
      },
    },
  },
  build: {
    sourcemap: true, // Generate source maps for Sentry
  },
});
