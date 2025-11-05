import { atom } from "jotai";
import type { FeatureCollection, MultiPolygon } from "geojson";

export type AlluProps = {
  id?: number;
  hakemus?: string; // e.g. "Kaivuilmoitus"
  hakemustunnus?: string;
  osoite?: string;
  kaupunginosa?: string;
  status?: string; // e.g. "Käynnissä"
  tyo_alkaa?: string; // yyyy-mm-dd
  tyo_paattyy?: string; // yyyy-mm-dd
  tyo_alkaa_txt?: string;
  tyo_paattyy_txt?: string;
};

export type DisruptionsState = {
  kaivuilmoitukset: FeatureCollection<MultiPolygon, AlluProps> | null;
  loading: boolean;
  error: Error | null;
};

export const disruptionsAtom = atom<DisruptionsState>({
  kaivuilmoitukset: null,
  loading: true,
  error: null,
});

disruptionsAtom.onMount = (set) => {
  const controller = new AbortController();

  const base =
    "/hel-wfs/ws/geoserver/avoindata/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=Kaivuilmoitus_alue&outputFormat=application/json&SRSNAME=urn:ogc:def:crs:EPSG:4326";
  // Focus on ongoing disturbances and limit response size
  const url = `${base}&count=500&CQL_FILTER=${encodeURIComponent("status='Käynnissä'")}`;

  set((prev) => ({ ...prev, loading: true, error: null }));
  fetch(url, { signal: controller.signal })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((json) =>
      set({
        kaivuilmoitukset: json as FeatureCollection<MultiPolygon, AlluProps>,
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


