import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getListLandLeaseQueryOptions, landLeaseTypes } from "../queries/land-leases";
import { getTrafficDisturbancesQueryOptions } from "../queries/traffic-disturbances";
import {
  buildDisturbanceMapFromJson,
  mergeLandLeaseFeaturesIntoMap,
  type DisturbanceGroup,
  type DisturbanceMap,
} from "../utils/invertTrafficDisturbances";
import { useSearch } from "@tanstack/react-router";
import { Sources } from "../router";

type UseMergedDisturbancesReturn = {
  map: DisturbanceMap;
  groups: DisturbanceGroup[];
  isLoading: boolean;
  error: unknown;
  getSelectedGroupBySegment: (segmentId?: string) => DisturbanceGroup | undefined;
};

export function useMergedDisturbances(): UseMergedDisturbancesReturn {
  // Static JSON mounted/served via /data
  const { isPending: isPendingTraffic, data: trafficJson, error: trafficError } = useQuery(
    getTrafficDisturbancesQueryOptions(),
  );

  const { selectedDate, sources } = useSearch({ from: "/" });

  const { isPending: isPendingExc, data: excData, error: excError } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.EXCAVATION_NOTICE_AREA }),
  );
  const { isPending: isPendingLease, data: leaseData, error: leaseError } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.LAND_LEASE_AREA }),
  );

  const map = useMemo<DisturbanceMap>(() => {
    if (!trafficJson) return {} as DisturbanceMap;
    const base = buildDisturbanceMapFromJson(trafficJson);
    mergeLandLeaseFeaturesIntoMap(base, excData, "Kaivuilmoitus");
    mergeLandLeaseFeaturesIntoMap(base, leaseData, "Aluevuokraus");
    return base;
  }, [trafficJson, excData, leaseData]);

  const filteredMap = useMemo(() => {
    return Object.entries(map).filter(([ , group ]) => {
      // 1. Filter by Source
      if (group.type === 'Aluevuokraus' && !sources?.includes(Sources.AREA_RENTALS)) {
        return false;
      }
      if (group.type === 'Kaivuilmoitus' && !sources?.includes(Sources.EXCAVATION_NOTICES)) {
        return false;
      }

      // 2. Filter by Date (if selected)
      if (!selectedDate) return true;
      return new Date(group.start_date) <= selectedDate && new Date(group.end_date) >= selectedDate;
    }).reduce((acc, [ key, group ]) => {
      acc[key] = group;
      return acc;
    }, {} as Record<string, DisturbanceGroup>);
  }, [map, selectedDate, sources]);

  const groups = useMemo<DisturbanceGroup[]>(() => Object.values(filteredMap), [filteredMap]);

  const getSelectedGroupBySegment = (segmentId?: string) => {
    if (!segmentId) return undefined;
    return groups.find((g) => Boolean(g.segments[segmentId]));
  };

  return {
    map: filteredMap,
    groups,
    isLoading: Boolean(isPendingTraffic || isPendingExc || isPendingLease),
    error: trafficError ?? excError ?? leaseError ?? null,
    getSelectedGroupBySegment,
  };
}


