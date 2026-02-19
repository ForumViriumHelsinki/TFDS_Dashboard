import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  AirQualityTypes,
  getListAirQualityQueryOptions,
} from "../queries/air-quality";
import {
  getAirQualityStationId,
  parseFinnishAikaToDate,
  AirQualityProps,
} from "../utils/airQuality";
import type { Feature, Geometry, FeatureCollection } from "geojson";

export const AIR_QUALITY_NOW_QUERY_KEY = [
  "air-quality",
  { airQualityType: AirQualityTypes.AIR_QUALITY_NOW },
];

export const AIR_QUALITY_24H_QUERY_KEY = [
  "air-quality",
  { airQualityType: AirQualityTypes.AIR_QUALITY_24H_MAX },
];

export function useFilteredAirQuality(
  selectedDate: Date | null | undefined,
  selectedDateMode: "live" | "manual" | undefined,
  enabled: boolean = true,
) {
  const useHistorical = selectedDateMode === "manual";

  const nowQuery = useQuery({
    ...getListAirQualityQueryOptions({
      airQualityType: AirQualityTypes.AIR_QUALITY_NOW,
    }),
    queryKey: AIR_QUALITY_NOW_QUERY_KEY,
    enabled,
  });

  const shouldFetchHistorical = enabled && useHistorical;

  const historicalQuery = useQuery({
    ...getListAirQualityQueryOptions({
      airQualityType: AirQualityTypes.AIR_QUALITY_24H_MAX,
    }),
    queryKey: AIR_QUALITY_24H_QUERY_KEY,
    enabled: shouldFetchHistorical,
  });

  const filteredHistoricalData = useMemo(() => {
    if (!historicalQuery.data || !selectedDate) return undefined;

    const targetTs = selectedDate.getTime();
    const stationMap = new Map<
      string,
      { diff: number; feature: Feature<Geometry, AirQualityProps> }
    >();

    for (const feature of historicalQuery.data.features) {
      const airQualityProperties = feature.properties ?? {};
      const date = parseFinnishAikaToDate(airQualityProperties.Aika);
      if (!date) continue;

      const diff = Math.abs(date.getTime() - targetTs);
      const stationId = getAirQualityStationId(feature);

      if (
        !stationMap.has(stationId) ||
        diff < stationMap.get(stationId)!.diff
      ) {
        stationMap.set(stationId, { diff, feature });
      }
    }

    return {
      type: "FeatureCollection",
      features: Array.from(stationMap.values()).map((value) => value.feature),
    } as FeatureCollection<Geometry, AirQualityProps>;
  }, [historicalQuery.data, selectedDate]);

  const data = useHistorical
    ? (filteredHistoricalData ?? nowQuery.data)
    : nowQuery.data;

  const isPending = useHistorical
    ? historicalQuery.isPending && !filteredHistoricalData && !nowQuery.data
    : nowQuery.isPending && !nowQuery.data;

  const isError = useHistorical
    ? historicalQuery.isError && !filteredHistoricalData && !nowQuery.data
    : nowQuery.isError;

  const error = useHistorical ? historicalQuery.error : nowQuery.error;

  return {
    data,
    isPending,
    isFetching: useHistorical ? historicalQuery.isFetching : nowQuery.isFetching,
    isError,
    error,
    refetch: useHistorical ? historicalQuery.refetch : nowQuery.refetch,
  };
}
