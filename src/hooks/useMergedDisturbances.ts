import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getListLandLeaseQueryOptions, landLeaseTypes } from "../queries/land-leases";
import {
  buildDisturbanceMapFromJson,
  mergeLandLeaseFeaturesIntoMap,
  type DisturbanceGroup,
  type DisturbanceMap,
} from "../utils/invertTrafficDisturbances";

type UseMergedDisturbancesReturn = {
  map: DisturbanceMap;
  groups: DisturbanceGroup[];
  isLoading: boolean;
  error: unknown;
  getSelectedGroupBySegment: (segmentId?: string) => DisturbanceGroup | undefined;
};

export function useMergedDisturbances(): UseMergedDisturbancesReturn {
  const { isPending: isPendingExc, data: excData, error: excError } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.EXCAVATION_NOTICE_AREA }),
  );
  const { isPending: isPendingLease, data: leaseData, error: leaseError } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.LAND_LEASE_AREA }),
  );

  const map = useMemo<DisturbanceMap>(() => {
    const base = buildDisturbanceMapFromJson();
    mergeLandLeaseFeaturesIntoMap(base, excData, "Kaivuilmoitus");
    mergeLandLeaseFeaturesIntoMap(base, leaseData, "Aluevuokraus");
    return base;
  }, [excData, leaseData]);

  const groups = useMemo<DisturbanceGroup[]>(() => Object.values(map), [map]);

  const getSelectedGroupBySegment = (segmentId?: string) => {
    if (!segmentId) return undefined;
    return groups.find((g) => Boolean(g.segments[segmentId]));
  };

  return {
    map,
    groups,
    isLoading: Boolean(isPendingExc || isPendingLease),
    error: excError ?? leaseError ?? null,
    getSelectedGroupBySegment,
  };
}


