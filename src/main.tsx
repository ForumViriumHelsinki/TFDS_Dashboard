import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import "./index.css";
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { createTheme, MantineProvider } from "@mantine/core";
import { Calendar } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DatesProvider } from "@mantine/dates";
import 'dayjs/locale/fi';

const queryClient = new QueryClient();

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

// Brand color constant
export const BRAND_COLOR = '#FF5000';
export const BORDER_COLOR = '#F1F3F5';
export const BG_COLOR = '#F8F9FA';

const theme = createTheme({
  fontFamily: "Montserrat, sans-serif",
  primaryColor: "brand",
  colors: {
    brand: [
      BRAND_COLOR,
      BRAND_COLOR,
      BRAND_COLOR,
      BRAND_COLOR,
      BRAND_COLOR,
      BRAND_COLOR,
      BRAND_COLOR,
      BRAND_COLOR,
      BRAND_COLOR,
      BRAND_COLOR,
    ],
  },
  components: {
    Tabs: {
      styles: {
        tab: {
          padding: "1rem",
          borderWidth: "0px 0px 5px 0px",
        },
      },
    },
    Accordion: {
      styles: {
        chevron: {
          color: BRAND_COLOR,
        },
      },
    },
    DateTimePicker: {
      defaultProps: {
        clearable: true,
        valueFormat: "DD.MM.YYYY HH:mm",
        leftSection: <Calendar size={16} />,
        popoverProps: { withinPortal: true, zIndex: 1200 },
      },
    },
  },
});

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light" theme={theme}>
        <DatesProvider settings={{ locale: "fi" }}>
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
            <QueryClientProvider client={queryClient}>
              <RouterProvider router={router} />
            </QueryClientProvider>
          </Sentry.ErrorBoundary>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);


