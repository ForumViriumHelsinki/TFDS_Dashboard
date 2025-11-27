import { useMantineTheme } from "@mantine/core";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { FeatureGroup, GeoJSON, Pane } from "react-leaflet";

type SegmentFeatureProps = {
  segmentId?: string;
} & Record<string, unknown>;

type DisturbanceLayerProps = {
  featureCollection: FeatureCollection<Geometry, SegmentFeatureProps>;
  paneName: string;
  zIndex: number;
  layerKey: string;
  selectedSegment?: string;
  onSegmentSelect: (segmentId: string) => void;
};

export function DisturbanceLayer({
  featureCollection,
  paneName,
  zIndex,
  layerKey,
  selectedSegment,
  onSegmentSelect,
}: DisturbanceLayerProps) {
  const theme = useMantineTheme();
  const features = featureCollection.features ?? [];

  if (features.length === 0) {
    return null;
  }

  return (
    <Pane name={paneName} style={{ zIndex }}>
      <FeatureGroup>
        <GeoJSON
          key={layerKey}
          pane={paneName}
          data={featureCollection}
          style={(feature?: Feature<Geometry, SegmentFeatureProps>) => {
            const segmentId = feature?.properties?.segmentId;
            const isSelected = Boolean(
              segmentId && segmentId === selectedSegment
            );
            return {
              color: theme.colors.brand[0],
              weight: isSelected ? 12 : 6,
              opacity: isSelected ? 1 : 0.5,
            };
          }}
          onEachFeature={(
            feature: Feature<Geometry, SegmentFeatureProps>,
            layer
          ) => {
            layer.on("click", () => {
              const segmentId = feature.properties?.segmentId;
              if (segmentId) {
                onSegmentSelect(segmentId);
              }
            });
          }}
        />
      </FeatureGroup>
    </Pane>
  );
}
