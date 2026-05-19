import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiPolygon,
} from "geojson";
import type { LandLeaseProps } from "../queries/land-leases";

export type DisturbanceType = "Kaivuilmoitus" | "Aluevuokraus";

export type CollisionProperties = {
  traffic_disturbance_type: DisturbanceType;
  traffic_disturbance_id: number;
  application_id: string;
  star_date: string;
  end_date: string;
};

export type SegmentEntry = {
  geometry: LineString;
  detailedCollisions: Array<{ properties: CollisionProperties }>;
};

export type DisturbanceGroup = {
  type: DisturbanceType;
  id: number;
  application_id: string;
  start_date: string;
  end_date: string;
  segments: Record<string, SegmentEntry>;
  // Optional enrichment from WFS land-lease datasets (geometry + properties)
  landLeaseGeometry?: MultiPolygon;
  landLeaseProperties?: LandLeaseProps;
};

export type DisturbanceMap = Record<string, DisturbanceGroup>;

export type TrafficJson = {
  segmentId: Record<string, SegmentEntry>;
};

export type SegmentsMappingJson = {
  segmentId: Record<string, { geometry: LineString }>;
};

export function buildDisturbanceMapFromJson(
  source: TrafficJson,
): DisturbanceMap {
  const inverted: DisturbanceMap = {};
  for (const [segmentId, segment] of Object.entries(source.segmentId ?? {})) {
    for (const detailedCollision of segment.detailedCollisions ?? []) {
      const properties = detailedCollision.properties;
      const key = `${properties.traffic_disturbance_type}:${properties.traffic_disturbance_id}`;
      if (!inverted[key]) {
        inverted[key] = {
          type: properties.traffic_disturbance_type,
          id: properties.traffic_disturbance_id,
          application_id: properties.application_id,
          start_date: properties.star_date,
          end_date: properties.end_date,
          segments: {},
        };
      }
      inverted[key].segments[segmentId] = segment as SegmentEntry;
    }
  }
  return inverted;
}

/**
 * Merge land-lease WFS features into an existing disturbance map by matching
 * application_id (from static data) to hakemustunnus (from WFS).
 * If disturbanceType is provided, only entries of that type are considered for merging.
 */
export function mergeLandLeaseFeaturesIntoMap(
  map: DisturbanceMap,
  landLeaseFC?: FeatureCollection<MultiPolygon, LandLeaseProps>,
  disturbanceType?: DisturbanceType,
): DisturbanceMap {
  if (!landLeaseFC?.features?.length) return map;
  const typesToCheck: DisturbanceType[] = disturbanceType
    ? [disturbanceType]
    : ["Kaivuilmoitus", "Aluevuokraus"];

  // Build lookup from application_id to disturbance group keys
  const appIdToKeys = new Map<string, string[]>();
  for (const [key, group] of Object.entries(map)) {
    if (!typesToCheck.includes(group.type)) continue;
    if (!group.application_id) continue;
    const existing = appIdToKeys.get(group.application_id) ?? [];
    existing.push(key);
    appIdToKeys.set(group.application_id, existing);
  }

  for (const feature of landLeaseFC.features) {
    const props = (feature.properties ?? {}) as LandLeaseProps;
    const hakemustunnus = props.hakemustunnus;
    if (!hakemustunnus) continue;
    const keys = appIdToKeys.get(hakemustunnus);
    if (!keys) continue;
    for (const key of keys) {
      const group = map[key];
      if (group) {
        group.landLeaseGeometry = feature.geometry ?? undefined;
        group.landLeaseProperties = props;
      }
    }
  }
  return map;
}

export function buildPolygonFeatureCollection(
  map: DisturbanceMap,
): FeatureCollection<MultiPolygon, { groupKey: string }> {
  const features: Array<Feature<MultiPolygon, { groupKey: string }>> = [];
  for (const [key, group] of Object.entries(map)) {
    if (!group.landLeaseGeometry) continue;
    features.push({
      type: "Feature",
      geometry: group.landLeaseGeometry,
      properties: { groupKey: key },
    });
  }
  return { type: "FeatureCollection", features };
}

export function buildSegmentsFeatureCollection(
  map: DisturbanceMap,
): FeatureCollection<LineString, { segmentId: string }> {
  const seen: Record<string, true> = {};
  const features: Array<Feature<LineString, { segmentId: string }>> = [];
  for (const group of Object.values(map)) {
    for (const [segmentId, segment] of Object.entries(group.segments)) {
      if (seen[segmentId]) continue;
      seen[segmentId] = true;
      features.push({
        type: "Feature",
        geometry: segment.geometry,
        properties: { segmentId },
      });
    }
  }
  return { type: "FeatureCollection", features } as FeatureCollection<
    LineString,
    { segmentId: string }
  >;
}

export function buildSegmentsMappingFeatureCollection(
  mapping?: SegmentsMappingJson,
  segmentColorById?: Map<string, string>,
): FeatureCollection<LineString, { segmentId: string; segmentColor?: string }> {
  const features: Array<
    Feature<LineString, { segmentId: string; segmentColor?: string }>
  > = [];

  for (const [segmentId, entry] of Object.entries(mapping?.segmentId ?? {})) {
    if (!entry?.geometry) continue;

    features.push({
      type: "Feature",
      geometry: entry.geometry,
      properties: {
        segmentId,
        segmentColor: segmentColorById?.get(segmentId),
      },
    });
  }

  return {
    type: "FeatureCollection",
    features,
  } as FeatureCollection<
    LineString,
    { segmentId: string; segmentColor?: string }
  >;
}

export const getTrafficSegmentsFC = (
  mapping: SegmentsMappingJson,
  disturbance: { segmentId: Record<string, unknown> },
): FeatureCollection<LineString, { segmentId: string }> => {
  const allowedSegmentIds = new Set(Object.keys(disturbance.segmentId ?? {}));
  const features: Array<Feature<LineString, { segmentId: string }>> = [];
  for (const [segmentId, entry] of Object.entries(mapping.segmentId ?? {})) {
    if (!entry?.geometry) continue;
    if (!allowedSegmentIds.has(segmentId)) continue;
    features.push({
      type: "Feature",
      geometry: entry.geometry,
      properties: { segmentId },
    });
  }
  return { type: "FeatureCollection", features } as FeatureCollection<
    LineString,
    { segmentId: string }
  >;
};
