
import type { FeatureCollection, Geometry } from "geojson";
import { atom } from "jotai";
import type { AirQualityProps } from "../utils/airQuality";

export type AirQualityState = {
  airQualityData: FeatureCollection<Geometry, AirQualityProps> | null;
  loading: boolean;
  error: Error | null;
};

export const airQualityAtom = atom<AirQualityState>({
  airQualityData: null,
  loading: true,
  error: null,
});

airQualityAtom.onMount = (set) => {
  const controller = new AbortController();
  const url =
    "/hsy-wfs/geoserver/wfs?version=2.0.0&request=GetFeature&typeNames=Ilmanlaatu_nyt&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326";

  set((prev) => ({ ...prev, loading: true, error: null }));
  fetch(url, { signal: controller.signal })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((json) =>
      set({
        airQualityData: json as FeatureCollection<Geometry, AirQualityProps>,
        loading: false,
        error: null,
      }),
    )
    .catch((e) => {
      if ((e as Error).name === "AbortError") return;
      set((prev) => ({ ...prev, loading: false, error: e as Error }));
    });

  return () => controller.abort();
};