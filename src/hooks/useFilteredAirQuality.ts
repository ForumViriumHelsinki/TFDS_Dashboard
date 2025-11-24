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
import type { Feature, Geometry } from "geojson";

export function useFilteredAirQuality(
  selectedDate: Date | null | undefined,
  enabled: boolean = true
) {
  const { data: airQualityData, ...rest } = useQuery({
    ...getListAirQualityQueryOptions({
      airQualityType: selectedDate
        ? AirQualityTypes.AIR_QUALITY_24H_MAX
        : AirQualityTypes.AIR_QUALITY_NOW,
    }),
    enabled,
  });

  const filteredData = useMemo(() => {
    if (!airQualityData || !selectedDate) return airQualityData;

    const targetTs = selectedDate.getTime();
    const stationMap = new Map<
      string,
      { diff: number; feature: Feature<Geometry, AirQualityProps> }
    >();

    for (const feature of airQualityData.features) {
      const aqProps = feature.properties ?? {};
      const d = parseFinnishAikaToDate(aqProps.Aika);
      if (!d) continue;

      const diff = Math.abs(d.getTime() - targetTs);
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
      features: Array.from(stationMap.values()).map((v) => v.feature),
    } as import("geojson").FeatureCollection<Geometry, AirQualityProps>;
  }, [airQualityData, selectedDate]);

  return {
    data: filteredData,
    ...rest,
  };
}

