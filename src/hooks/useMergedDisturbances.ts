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

  const groups = useMemo<DisturbanceGroup[]>(() => Object.values(map), [map]);

  const getSelectedGroupBySegment = (segmentId?: string) => {
    if (!segmentId) return undefined;
    return groups.find((g) => Boolean(g.segments[segmentId]));
  };
  
  return {
    map,
    groups,
    isLoading: Boolean(isPendingTraffic || isPendingExc || isPendingLease),
    error: trafficError ?? excError ?? leaseError ?? null,
    getSelectedGroupBySegment,
  };
}


