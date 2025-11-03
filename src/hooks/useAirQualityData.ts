import { useEffect, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";

export type AirProps = {
  Mittausasema?: string;
  Aika?: string;
  Ilmanlaatuindeksi?: number;
  Mittausaseman_osoite?: string;
  Mittausaseman_numero?: number;
};

type UseAirQualityDataResult = {
  data: FeatureCollection<Geometry, AirProps> | null;
  loading: boolean;
  error: Error | null;
};

export function useAirQualityData(): UseAirQualityDataResult {
  const [data, setData] = useState<FeatureCollection<Geometry, AirProps> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url =
      "/hsy-wfs/geoserver/wfs?version=2.0.0&request=GetFeature&typeNames=Ilmanlaatu_nyt&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326";

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setData(json as FeatureCollection<Geometry, AirProps>))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e as Error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return { data, loading, error };
}

export const getAqiColor = (index?: number): string => {
  if (index === undefined || index === null) return "#7e7e7e";
  if (index <= 50) return "#2ecc71";
  if (index <= 75) return "#ffd400";
  if (index <= 100) return "#ff8c00";
  if (index <= 150) return "#c0392b";
  return "#8e44ad";
};


