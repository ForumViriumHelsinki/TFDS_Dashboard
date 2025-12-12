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

export const getListAirQualityQueryOptions = (
  requestParams: ListAirQualityRequest,
) =>
  queryOptions({
    queryKey: ["air-quality", requestParams],
    queryFn: async () => {
      const response = await fetch(
        `/hsy-wfs/geoserver/wfs?version=2.0.0&request=GetFeature&typeNames=${requestParams.airQualityType}&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326`,
      );
      const data = await response.json();
      return data as FeatureCollection<Geometry, AirQualityProps>;
    },
  });
