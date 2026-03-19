import type { Feature, FeatureCollection, Geometry } from "geojson";
import { FeatureGroup, GeoJSON, Pane } from "react-leaflet";

type SegmentFeatureProps = {
  segmentId?: string;
  segmentColor?: string;
} & Record<string, unknown>;

type SegmentLayerProps = {
  featureCollection: FeatureCollection<Geometry, SegmentFeatureProps>;
  paneName: string;
  zIndex: number;
  layerKey: string;
  selectedSegment?: string;
  onSegmentSelect: (segmentId: string) => void;
  interactive?: boolean;
  defaultColor?: string;
  weight?: number;
  selectedWeight?: number;
  opacity?: number;
  shadow?: boolean;
};

export function SegmentLayer({
  featureCollection,
  paneName,
  zIndex,
  layerKey,
  selectedSegment,
  onSegmentSelect,
  interactive = true,
  defaultColor = "#455AF6",
  weight = 6,
  selectedWeight = 12,
  opacity = 1,
  shadow = true,
}: SegmentLayerProps) {
  const features = featureCollection.features ?? [];

  if (features.length === 0) {
    return null;
  }

  return (
    <Pane
      name={paneName}
      style={{
        zIndex,
        filter: shadow
          ? "drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.25))"
          : undefined,
      }}
    >
      <FeatureGroup>
        <GeoJSON
          key={layerKey}
          pane={paneName}
          data={featureCollection}
          style={(feature?: Feature<Geometry, SegmentFeatureProps>) => {
            const segmentId = feature?.properties?.segmentId;
            const isSelected = Boolean(
              segmentId && segmentId === selectedSegment,
            );
            return {
              color: feature?.properties?.segmentColor ?? defaultColor,
              weight: isSelected ? selectedWeight : weight,
              opacity,
              interactive,
              bubblingMouseEvents: interactive,
            };
          }}
          onEachFeature={
            interactive
              ? (
                  feature: Feature<Geometry, SegmentFeatureProps>,
                  layer,
                ) => {
                  layer.on("click", () => {
                    const segmentId = feature.properties?.segmentId;
                    if (segmentId) {
                      onSegmentSelect(segmentId);
                    }
                  });
                }
              : undefined
          }
        />
      </FeatureGroup>
    </Pane>
  );
}
