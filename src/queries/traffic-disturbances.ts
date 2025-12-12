import { queryOptions } from "@tanstack/react-query";
import type {
  SegmentsMappingJson,
  TrafficJson,
} from "../utils/invertTrafficDisturbances";

const DATA_BASE = import.meta.env.VITE_DATA_BASE || "/data";

export const getSegmentsMappingQueryOptions = () =>
  queryOptions({
    queryKey: ["segments-mapping"] as const,
    queryFn: async (): Promise<SegmentsMappingJson> => {
      const res = await fetch(`${DATA_BASE}/segments_mapping.json`);
      if (!res.ok) throw new Error(`Failed to load segments_mapping.json`);
      return res.json() as Promise<SegmentsMappingJson>;
    },
    staleTime: 5 * 60 * 1000,
  });

export const getTrafficDisturbancesQueryOptions = () =>
  queryOptions({
    queryKey: ["traffic-disturbances"] as const,
    queryFn: async (): Promise<TrafficJson> => {
      const res = await fetch(`${DATA_BASE}/traffic_disturbance_data.json`);
      if (!res.ok)
        throw new Error(`Failed to load traffic_disturbance_data.json`);
      return res.json() as Promise<TrafficJson>;
    },
    staleTime: 5 * 60 * 1000,
  });
