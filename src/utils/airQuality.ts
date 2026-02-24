import type { Geometry, Feature } from "geojson";

export type AirQualityProps = {
  Mittausasema?: string;
  Aika?: string;
  Ilmanlaatuindeksi?: number;
  Mittausaseman_osoite?: string;
  Mittausaseman_numero?: number;
};

export function getAirQualityStationId(
  feature: Feature<Geometry, AirQualityProps>,
): string {
  return String(feature.properties?.Mittausaseman_numero ?? "");
}

export function parseFinnishAikaToDate(aika?: string): Date | null {
  if (!aika) return null;
  // Supports formats like "8.11.2025 klo 3" or "08.11.2025 klo 03:30"
  const regexPattern =
    /(\d{1,2})\.(\d{1,2})\.(\d{4})\s*klo\s*(\d{1,2})(?::(\d{2}))?/i;
  const match = regexPattern.exec(aika.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1; // JS months 0-11
  const year = Number(match[3]);
  const hour = Number(match[4]);
  const minute = match[5] ? Number(match[5]) : 0;
  const date = new Date(year, month, day, hour, minute, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
