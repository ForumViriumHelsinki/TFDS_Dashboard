import type { Feature, FeatureCollection, LineString, MultiPolygon } from "geojson";
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

export function buildDisturbanceMapFromJson(src: TrafficJson): DisturbanceMap {
  const inverted: DisturbanceMap = {};
  for (const [segmentId, segment] of Object.entries(src.segmentId ?? {})) {
    for (const dc of segment.detailedCollisions ?? []) {
      const p = dc.properties;
      const key = `${p.traffic_disturbance_type}:${p.traffic_disturbance_id}`;
      if (!inverted[key]) {
        inverted[key] = {
          type: p.traffic_disturbance_type,
          id: p.traffic_disturbance_id,
          application_id: p.application_id,
          start_date: p.star_date,
          end_date: p.end_date,
          segments: {},
        };
      }
      inverted[key].segments[segmentId] = segment as SegmentEntry;
    }
  }
  return inverted;
}

/**
 * Merge land-lease WFS features into an existing disturbance map by matching ids.
 * If disturbanceType is provided, only entries of that type are considered for merging.
 */
export function mergeLandLeaseFeaturesIntoMap(
  map: DisturbanceMap,
  landLeaseFC?: FeatureCollection<MultiPolygon, LandLeaseProps>,
  disturbanceType?: DisturbanceType
): DisturbanceMap {
  if (!landLeaseFC?.features?.length) return map;
  const typesToCheck: DisturbanceType[] = disturbanceType
    ? [disturbanceType]
    : ["Kaivuilmoitus", "Aluevuokraus"];

  for (const feature of landLeaseFC.features) {
    const props = (feature.properties ?? {}) as LandLeaseProps;
    const id = props.id;
    if (id == null) continue;
    for (const t of typesToCheck) {
      const key = `${t}:${id}`;
      const group = map[key];
      if (group) {
        group.landLeaseGeometry = feature.geometry ?? undefined;
        group.landLeaseProperties = props;
      }
    }
  }
  return map;
}

export function buildSegmentsFeatureCollection(map: DisturbanceMap): FeatureCollection<LineString, { segmentId: string }> {
  const seen: Record<string, true> = {};
  const features: Array<Feature<LineString, { segmentId: string }>> = [];
  for (const group of Object.values(map)) {
    for (const [segmentId, seg] of Object.entries(group.segments)) {
      if (seen[segmentId]) continue;
      seen[segmentId] = true;
      features.push({
        type: "Feature",
        geometry: seg.geometry,
        properties: { segmentId },
      });
    }
  }
  return { type: "FeatureCollection", features } as FeatureCollection<LineString, { segmentId: string }>;
}

export const getTrafficSegmentsFC = (
  mapping: SegmentsMappingJson,
  disturbance: { segmentId: Record<string, unknown> }
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
  return { type: "FeatureCollection", features } as FeatureCollection<LineString, { segmentId: string }>;
};
 