import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { createTheme, MantineProvider, Box, Text, Title } from "@mantine/core";
import { Calendar } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DatesProvider } from "@mantine/dates";
import "dayjs/locale/fi";
import { OpenFeatureProvider } from "@openfeature/react-sdk";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { initializeFeatureFlags } from "./openfeature";

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

// Brand color - kept in theme only
const BRAND_COLOR = "#FF5000";

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

initializeFeatureFlags().then(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <GoogleOAuthProvider
        clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}
      >
        <MantineProvider defaultColorScheme="light" theme={theme}>
          <DatesProvider settings={{ locale: "fi" }}>
            <Sentry.ErrorBoundary
              fallback={({ error }) => (
                <Box p="2xl" style={{ textAlign: "center" }}>
                  <Title order={1}>Virhe</Title>
                  <Text>Pahoittelut, jotain meni pieleen.</Text>
                  <details style={{ marginTop: "1rem" }}>
                    <summary>Virheen yksityiskohdat</summary>
                    <Text>{String(error)}</Text>
                  </details>
                </Box>
              )}
            >
              <QueryClientProvider client={queryClient}>
                <OpenFeatureProvider>
                  <RouterProvider router={router} />
                </OpenFeatureProvider>
              </QueryClientProvider>
            </Sentry.ErrorBoundary>
          </DatesProvider>
        </MantineProvider>
      </GoogleOAuthProvider>
    </StrictMode>,
  );
});
