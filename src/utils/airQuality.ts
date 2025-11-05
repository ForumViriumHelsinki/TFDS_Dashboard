import type { Geometry, Feature } from "geojson";

export type AirQualityProps = {
  Mittausasema?: string;
  Aika?: string;
  Ilmanlaatuindeksi?: number;
  Mittausaseman_osoite?: string;
  Mittausaseman_numero?: number;
};

export const getAirQualityIndicatorColor = (index?: number): string => {
  if (index === undefined || index === null) return "#7e7e7e";
  if (index <= 50) return "#2ecc71";
  if (index <= 75) return "#ffd400";
  if (index <= 100) return "#ff8c00";
  if (index <= 150) return "#c0392b";
  return "#8e44ad";
};

export function getAirQualityStationId(feature: Feature<Geometry, AirQualityProps>): string {
  const p = (feature.properties ?? {}) as AirQualityProps;
  if (p.Mittausaseman_numero !== undefined && p.Mittausaseman_numero !== null) {
    return String(p.Mittausaseman_numero);
  }
  const name = (p.Mittausasema ?? "").trim().toLowerCase();
  const addr = (p.Mittausaseman_osoite ?? "").trim().toLowerCase();
  return `${name}|${addr}`;
}


