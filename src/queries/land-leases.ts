import { queryOptions } from "@tanstack/react-query";
import type { FeatureCollection, MultiPolygon } from "geojson";

export type LandLeaseProps = {
  id?: number;
  hakemus?: string;
  hakemustunnus?: string;
  osoite?: string;
  kaupunginosa?: string;
  status?: string;
  tyo_alkaa?: string;
  tyo_paattyy?: string;
  tyo_alkaa_txt?: string;
  tyo_paattyy_txt?: string;
};

export const landLeaseTypes = {
  EXCAVATION_NOTICE_AREA: "Kaivuilmoitus_alue",
  LAND_LEASE_AREA: "Aluevuokraus_alue",
} as const;
// eslint-disable-next-line no-redeclare
export type landLeaseTypes =
  (typeof landLeaseTypes)[keyof typeof landLeaseTypes];

export interface ListLandLeaseRequest {
  landLeaseType: landLeaseTypes;
}

export const getListLandLeaseQueryOptions = (
  requestParams: ListLandLeaseRequest,
) =>
  queryOptions({
    queryKey: ["land-leases", requestParams],
    queryFn: async () => {
      const response = await fetch(
        `/hel-wfs/ws/geoserver/avoindata/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=${requestParams.landLeaseType}&outputFormat=application/json&SRSNAME=urn:ogc:def:crs:EPSG:4326`,
      );
      const data = await response.json();
      return data as FeatureCollection<MultiPolygon, LandLeaseProps>;
    },
  });
