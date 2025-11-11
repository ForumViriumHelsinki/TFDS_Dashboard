import type { Geometry, Feature } from "geojson";

export type AirQualityProps = {
  Mittausasema?: string;
  Aika?: string;
  Ilmanlaatuindeksi?: number;
  Mittausaseman_osoite?: string;
  Mittausaseman_numero?: number;
};

export function getAirQualityStationId(feature: Feature<Geometry, AirQualityProps>): string {
  return String(feature.properties?.Mittausaseman_numero ?? "");
}

export const AIR_QUALITY_COLORS = {
  "Good air quality": "#67E567", // (103,229,103)
  "Satisfactory air quality": "#FFF055", // (255,240,85)
  "Fair air quality": "#FFBB58", // (255,187,88)
  "Poor air quality": "#FE4543", // (254,69,67)
  "Very poor air quality": "#B5468B", // (181,70,139)
} as const;

export function getAirQualityColor(index?: number): string {
  if (index === undefined || index === null) return "#7e7e7e";
  if (index <= 50) return AIR_QUALITY_COLORS["Good air quality"];
  if (index <= 75) return AIR_QUALITY_COLORS["Satisfactory air quality"];
  if (index <= 100) return AIR_QUALITY_COLORS["Fair air quality"];
  if (index <= 150) return AIR_QUALITY_COLORS["Poor air quality"];
  return AIR_QUALITY_COLORS["Very poor air quality"];
}