import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { z } from "zod";
import App from "./App";
import { segmentMeasurementFieldValues } from "./constants/segment-fields";

export const Sources = {
  AREA_RENTALS: "area-rentals",
  EXCAVATION_NOTICES: "excavation-notices",
  AIR_QUALITY: "air-quality",
} as const;
// eslint-disable-next-line no-redeclare
export type Sources = (typeof Sources)[keyof typeof Sources];

/**
 * Normalizes legacy snake_case segment measurement field values to the
 * current camelCase equivalents used in route search state.
 */
function normalizeSegmentMeasurementField(value: unknown) {
  if (value === "typical_speed") return "typicalSpeed";
  if (value === "current_speed") return "currentSpeed";
  return value;
}

// Validate and normalize query params once per route
const searchSchema = z.object({
  activeTab: z
    .enum(["Häiriöt", "Ilmanlaatu", "Segmentit"])
    .optional()
    .default("Häiriöt"),
  dataPanelOpen: z.coerce.boolean().optional().default(false).catch(false),
  selectedSegment: z.string().optional(),
  selectedAirQualityStation: z.string().optional(),
  landLeaseSearch: z.string().optional(),
  segmentMeasurementField: z.preprocess(
    normalizeSegmentMeasurementField,
    z
      .enum(segmentMeasurementFieldValues)
      .default("typicalSpeed")
      .catch("typicalSpeed"),
  ),
  selectedStartDate: z.coerce.date().optional(),
  selectedEndDate: z.coerce.date().optional(),
  selectedDate: z.coerce.date().optional(),
  sources: z
    .array(z.enum(Sources))
    .default(Object.values(Sources))
    .catch(Object.values(Sources)),
});

const rootRoute = createRootRoute();

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
  validateSearch: (search) => searchSchema.parse(search),
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute]),
});

export type Router = typeof router;

declare module "@tanstack/react-router" {
  interface Register {
    router: Router;
  }
}
