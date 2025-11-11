import type { Feature, FeatureCollection, LineString } from "geojson";
import trafficData from "../data/traffic_disturbance_data.json";

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
  star_date: string;
  end_date: string;
  segments: Record<string, SegmentEntry>;
};

export type DisturbanceMap = Record<string, DisturbanceGroup>;

type TrafficJson = {
  segmentId: Record<string, SegmentEntry>;
};

export function buildDisturbanceMapFromJson(): DisturbanceMap {
  const src = trafficData as unknown as TrafficJson;
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
          star_date: p.star_date,
          end_date: p.end_date,
          segments: {},
        };
      }
      inverted[key].segments[segmentId] = segment as SegmentEntry;
    }
  }
  return inverted;
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

export const getTrafficSegmentsFC = (): FeatureCollection<LineString, { segmentId: string }> => {
    const map = buildDisturbanceMapFromJson();
    return buildSegmentsFeatureCollection(map);
  };
  