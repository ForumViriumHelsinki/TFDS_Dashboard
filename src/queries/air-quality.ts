import { queryOptions } from "@tanstack/react-query";
import { AirQualityProps } from "../utils/airQuality";
import type { FeatureCollection, Geometry } from "geojson";

export const AirQualityTypes = {
  AIR_QUALITY_NOW: "Ilmanlaatu_nyt",
  AIR_QUALITY_24H_MAX: "Ilmanlaatu_24h_maksimiarvo",
} as const;
// eslint-disable-next-line no-redeclare
export type AirQualityTypes =
  (typeof AirQualityTypes)[keyof typeof AirQualityTypes];

export interface ListAirQualityRequest {
  airQualityType: AirQualityTypes;
}

/**
 * Error thrown when the HSY WFS endpoint responds but the body is not a usable
 * GeoJSON FeatureCollection. This covers truncated payloads (a partially filled
 * nginx cache), HTML/XML error pages, and OGC `ExceptionReport` documents — all
 * of which would otherwise surface as an opaque `SyntaxError` from
 * `response.json()`.
 */
export class AirQualityResponseError extends Error {
  constructor(message = "HSY WFS response incomplete or invalid") {
    super(message);
    this.name = "AirQualityResponseError";
  }
}

export async function fetchAirQuality(
  airQualityType: AirQualityTypes,
): Promise<FeatureCollection<Geometry, AirQualityProps>> {
  const response = await fetch(
    `/hsy-wfs/geoserver/wfs?version=2.0.0&request=GetFeature&typeNames=${airQualityType}&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326`,
  );

  if (!response.ok) {
    throw new Error(
      `HSY WFS request failed: ${response.status} ${response.statusText}`,
    );
  }

  // Read as text first so a truncated/non-JSON body yields a descriptive,
  // typed error instead of a raw SyntaxError from `response.json()`.
  const body = await response.text();

  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new AirQualityResponseError();
  }

  if (
    !data ||
    typeof data !== "object" ||
    (data as { type?: unknown }).type !== "FeatureCollection" ||
    !Array.isArray((data as { features?: unknown }).features)
  ) {
    throw new AirQualityResponseError();
  }

  return data as FeatureCollection<Geometry, AirQualityProps>;
}

export const getListAirQualityQueryOptions = (
  requestParams: ListAirQualityRequest,
) =>
  queryOptions({
    queryKey: ["air-quality", requestParams],
    queryFn: () => fetchAirQuality(requestParams.airQualityType),
    // Retry truncated/failed responses with exponential backoff. This pairs
    // with the upstream nginx cache fix: a request that races a cold cache can
    // return an incomplete body, and a retry after the cache fills succeeds.
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });
