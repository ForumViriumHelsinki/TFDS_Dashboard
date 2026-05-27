import React from "react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createTheme, MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OpenFeatureProvider } from "@openfeature/react-sdk";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
  createRootRoute,
  createRoute,
} from "@tanstack/react-router";
import { DatesProvider } from "@mantine/dates";
import App from "../src/App";

// Minimal theme mirroring the production theme's brand palette so components
// reading `theme.colors.brand[n]` do not crash. Keep in sync with src/main.tsx.
const testTheme = createTheme({
  primaryColor: "brand",
  colors: {
    brand: Array(10).fill("#FF5000") as unknown as [
      string, string, string, string, string,
      string, string, string, string, string,
    ],
  },
});

// Mock react-leaflet to avoid map initialization issues in tests
vi.mock("react-leaflet", () => {
  function LayersControlBase({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }
  function BaseLayer({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }
  function Overlay({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }
  LayersControlBase.BaseLayer = BaseLayer;
  LayersControlBase.Overlay = Overlay;

  function MapContainer({ children }: { children?: React.ReactNode }) {
    return <div data-testid="map-container">{children}</div>;
  }

  function FeatureGroup({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  }

  return {
    MapContainer,
    TileLayer: () => null,
    WMSTileLayer: () => null,
    LayersControl: LayersControlBase,
    FeatureGroup,
    GeoJSON: () => null,
    useMap: () => ({
      invalidateSize: vi.fn(),
      getContainer: vi.fn(() => document.createElement("div")),
      panTo: vi.fn(),
    }),
  };
});

// Mock leaflet
vi.mock("leaflet", () => ({
  default: {
    circleMarker: vi.fn(),
    geoJSON: vi.fn(() => ({
      getBounds: vi.fn(() => ({
        isValid: vi.fn(() => false),
        getCenter: vi.fn(),
      })),
    })),
  },
  circleMarker: vi.fn(),
  geoJSON: vi.fn(() => ({
    getBounds: vi.fn(() => ({
      isValid: vi.fn(() => false),
      getCenter: vi.fn(),
    })),
  })),
}));

function createTestRouter() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: App,
  });

  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const testRouter = createTestRouter();

  // RouterProvider already renders App via the route definition
  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <MantineProvider theme={testTheme}>
        <DatesProvider settings={{ locale: "fi" }}>
          <QueryClientProvider client={queryClient}>
            <OpenFeatureProvider>
              <RouterProvider router={testRouter} />
            </OpenFeatureProvider>
          </QueryClientProvider>
        </DatesProvider>
      </MantineProvider>
    </GoogleOAuthProvider>,
  );
}

describe("App Component", () => {
  it("renders the header with Forum Virium logo", async () => {
    renderApp();
    const logo = await screen.findByAltText("Forum Virium Helsinki");
    expect(logo).toBeInTheDocument();
  });

  it("renders the TFDS logo", async () => {
    renderApp();
    const tfdsLogo = await screen.findByAltText(
      "Traffic and Floating Data Space",
    );
    expect(tfdsLogo).toBeInTheDocument();
  });

  it("displays sidebar tabs", async () => {
    renderApp();
    const disruptionsTab = await screen.findByRole("tab", { name: /häiriöt/i });
    const airQualityTab = await screen.findByRole("tab", {
      name: /ilmanlaatu/i,
    });
    expect(disruptionsTab).toBeInTheDocument();
    expect(airQualityTab).toBeInTheDocument();
  });

  it("displays date picker label", async () => {
    renderApp();
    const dateLabel = await screen.findByText("Ajankohta");
    expect(dateLabel).toBeInTheDocument();
  });

  it("displays data source checkboxes", async () => {
    renderApp();
    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: "Aluevuokraukset" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("checkbox", { name: "Kaivuilmoitukset" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Ilmanlaatu" }),
    ).toBeInTheDocument();
  });

  it("renders the map container", async () => {
    renderApp();
    const mapContainer = await screen.findByTestId("map-container");
    expect(mapContainer).toBeInTheDocument();
  });
});
