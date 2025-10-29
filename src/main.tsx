import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import "./index.css";
import App from "./App";
import { createTheme, MantineProvider } from "@mantine/core";

// Initialize Sentry if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions for monitoring
    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
    // Environment and release tracking
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || "0.1.0",
  });
}

const theme = createTheme({
  fontFamily: "Montserrat, sans-serif",
  primaryColor: "orange",
  components: {
    Tabs: {
      styles: {
        tab: {
          padding: "1rem",
          borderWidth: "0px 0px 5px 0px",
        },
      },
    },
  },
});

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light" theme={theme}>
      <Sentry.ErrorBoundary
        fallback={({ error }) => (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <h1>Application Error</h1>
            <p>Sorry, something went wrong.</p>
            <details style={{ marginTop: "1rem" }}>
              <summary>Error details</summary>
              <pre style={{ textAlign: "left", marginTop: "1rem" }}>
                {String(error)}</pre>
            </details>
          </div>
        )}
      >
        <App />
      </Sentry.ErrorBoundary>
    </MantineProvider>
  </StrictMode>,
);


