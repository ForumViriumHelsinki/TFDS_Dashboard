import { Box, useMantineTheme } from "@mantine/core";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  WMSTileLayer,
  FeatureGroup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import {
  AirQualityProps,
  getAirQualityColor,
  getAirQualityStationId,
} from "../../utils/airQuality";
import L from "leaflet";
import type {
  Geometry,
  Feature,
  GeoJsonObject,
  FeatureCollection,
} from "geojson";
import { AirQualityIndicator } from "./AirQualityIndicator";
import { SegmentIndicator } from "./SegmentIndicator";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { buildSegmentsFeatureCollection } from "../../utils/invertTrafficDisturbances";
import { useMergedDisturbances } from "../../hooks/useMergedDisturbances";
import { Sources } from "../../router";
import { useFilteredAirQuality } from "../../hooks/useFilteredAirQuality";
import { DisturbanceLayer } from "./DisturbanceLayer";
import { useFallbackDate } from "../../hooks/useFallbackDate";
import { useQuery } from "@tanstack/react-query";
import {
  getFloatingCarDataFieldPointsBySegmentQueryOptions,
} from "../../queries/floating-car-data";
import { getSegmentsMappingQueryOptions } from "../../queries/traffic-disturbances";
import type { LineString } from "geojson";
import { getDefaultDateRange } from "../../utils/defaultDateRange";
import { getSegmentMeasurementFieldConfig } from "../../constants/segment-fields";
import { getSegmentColorForValue } from "../../utils/segmentColors";

type SegmentPoint = {
  timestampMs: number;
  value: number;
};

function findNearestPointValue(points: SegmentPoint[], targetMs: number): number | undefined {
  if (points.length === 0 || !Number.isFinite(targetMs)) {
    return undefined;
  }

  let low = 0;
  let high = points.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTs = points[mid].timestampMs;

    if (midTs < targetMs) {
      low = mid + 1;
    } else if (midTs > targetMs) {
      high = mid - 1;
    } else {
      return points[mid].value;
    }
  }

  const rightIndex = Math.min(low, points.length - 1);
  const leftIndex = Math.max(0, rightIndex - 1);
  const rightPoint = points[rightIndex];
  const leftPoint = points[leftIndex];
  const leftDistance = Math.abs(leftPoint.timestampMs - targetMs);
  const rightDistance = Math.abs(rightPoint.timestampMs - targetMs);

  if (rightDistance < leftDistance) {
    return rightPoint.value;
  }
  if (leftDistance < rightDistance) {
    return leftPoint.value;
  }
  return rightPoint.timestampMs >= leftPoint.timestampMs
    ? rightPoint.value
    : leftPoint.value;
}

function FitMapToSelected({
  selectedSegment,
  featureCollections,
}: {
  selectedSegment?: string;
  featureCollections: FeatureCollection[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedSegment) return;
    const allFeatures: Array<Feature<Geometry, { segmentId?: string }>> =
      featureCollections.flatMap(
        (collection) =>
          (collection.features as
            | Array<Feature<Geometry, { segmentId?: string }>>
            | undefined) ?? [],
      );
    const matched =
      allFeatures.find(
        (feature) => feature?.properties?.segmentId === selectedSegment,
      ) ?? null;
    if (!matched) return;
    const bounds = L.geoJSON(matched as unknown as GeoJsonObject).getBounds();
    if (bounds.isValid()) {
      const center = bounds.getCenter();
      map.panTo(center, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedSegment]);

  return null;
}

export function MapView() {
  const theme = useMantineTheme();
  const {
    selectedSegment,
    selectedDate,
    dataPanelOpen,
    sources,
    activeTab,
    segmentMeasurementField,
    selectedStartDate,
    selectedEndDate,
  } = useSearch({
    from: "/",
    select: (s) => ({
      selectedSegment: s.selectedSegment,
      selectedDate: s.selectedDate,
      dataPanelOpen: s.dataPanelOpen,
      sources: s.sources,
      activeTab: s.activeTab,
      segmentMeasurementField: s.segmentMeasurementField,
      selectedStartDate: s.selectedStartDate,
      selectedEndDate: s.selectedEndDate,
    }),
  });
  const navigate = useNavigate({ from: "/" });
  const showSegmentsTab = activeTab === "Segmentit";
  const showAirQuality =
    !showSegmentsTab && sources?.includes(Sources.AIR_QUALITY);
  const showAreaRentals =
    !showSegmentsTab && sources?.includes(Sources.AREA_RENTALS);
  const showExcavationNotices =
    !showSegmentsTab && sources?.includes(Sources.EXCAVATION_NOTICES);
  const { map: disturbanceMap } = useMergedDisturbances();

  const areaRentalSegmentsFeatureCollection = useMemo(() => {
    const entries = Object.entries(disturbanceMap).filter(
      ([, group]) => group.type === "Aluevuokraus",
    );
    return buildSegmentsFeatureCollection(Object.fromEntries(entries));
  }, [disturbanceMap]);
  const excavationSegmentsFeatureCollection = useMemo(() => {
    const entries = Object.entries(disturbanceMap).filter(
      ([, group]) => group.type === "Kaivuilmoitus",
    );
    return buildSegmentsFeatureCollection(Object.fromEntries(entries));
  }, [disturbanceMap]);

  const { data: filteredAirQualityData } = useFilteredAirQuality(
    selectedDate,
    Boolean(showAirQuality),
  );
  const fallbackDate = useFallbackDate(Boolean(!selectedDate), 60_000);
  const displayDate = selectedDate ?? fallbackDate;
  const fallbackRange = useMemo(() => getDefaultDateRange(), []);
  const { start: segmentsStart, end: segmentsEnd } = useMemo(() => {
    const effectiveEnd = selectedEndDate ?? fallbackRange.end;
    const effectiveStart = selectedStartDate ?? fallbackRange.start;
    return { start: effectiveStart, end: effectiveEnd };
  }, [fallbackRange.end, fallbackRange.start, selectedEndDate, selectedStartDate]);
  const selectedDateOutline = displayDate
    ? {
        border: `1px dashed ${theme.colors.brand[0]}`,
        borderOffset: "-1px",
      }
    : undefined;

  const { data: segmentsMapping } = useQuery(getSegmentsMappingQueryOptions());
  const { data: segmentRows } = useQuery({
    ...getFloatingCarDataFieldPointsBySegmentQueryOptions({
      start: segmentsStart,
      end: segmentsEnd,
      field: segmentMeasurementField ?? "",
    }),
    enabled: Boolean(showSegmentsTab && segmentMeasurementField),
  });

  const segmentPointsById = useMemo(() => {
    const grouped = new Map<string, SegmentPoint[]>();
    if (!Array.isArray(segmentRows) || !segmentMeasurementField) {
      return grouped;
    }

    for (const row of segmentRows) {
      const segmentId = row.segmentId?.trim();
      if (!segmentId) continue;
      const timestampMs = row.timestamp.getTime();
      if (!Number.isFinite(timestampMs) || !Number.isFinite(row.value)) continue;

      const existing = grouped.get(segmentId);
      const point = { timestampMs, value: row.value };
      if (existing) {
        existing.push(point);
      } else {
        grouped.set(segmentId, [point]);
      }
    }

    for (const points of grouped.values()) {
      points.sort((a, b) => a.timestampMs - b.timestampMs);
    }

    return grouped;
  }, [segmentRows, segmentMeasurementField]);

  const targetDateMs = displayDate.getTime();

  const segmentFieldValueById = useMemo(() => {
    const values = new Map<string, number>();
    if (!segmentMeasurementField || segmentPointsById.size === 0) {
      return values;
    }

    for (const [segmentId, points] of segmentPointsById.entries()) {
      const value = findNearestPointValue(points, targetDateMs);
      if (!Number.isFinite(value)) continue;
      values.set(segmentId, value);
    }

    return values;
  }, [segmentMeasurementField, segmentPointsById, targetDateMs]);

  const segmentFieldIdSet = useMemo(() => {
    if (!segmentMeasurementField) {
      return new Set<string>();
    }
    return new Set(segmentFieldValueById.keys());
  }, [segmentMeasurementField, segmentFieldValueById]);

  const segmentFieldConfig = useMemo(
    () => getSegmentMeasurementFieldConfig(segmentMeasurementField),
    [segmentMeasurementField],
  );

  const segmentColorById = useMemo(() => {
    const colors = new Map<string, string>();
    if (!showSegmentsTab || !segmentFieldConfig || segmentFieldValueById.size === 0) {
      return colors;
    }

    for (const [segmentId, value] of segmentFieldValueById.entries()) {
      colors.set(segmentId, getSegmentColorForValue(value, segmentFieldConfig.yMax));
    }

    return colors;
  }, [showSegmentsTab, segmentFieldConfig, segmentFieldValueById]);

  const segmentsFeatureCollection = useMemo(() => {
    const features: Array<
      Feature<LineString, { segmentId: string; segmentColor?: string }>
    > = [];
    if (!segmentsMapping?.segmentId) {
      return {
        type: "FeatureCollection",
        features,
      } as FeatureCollection<LineString, { segmentId: string; segmentColor?: string }>;
    }
    const allowed =
      showSegmentsTab && segmentMeasurementField
        ? segmentFieldIdSet
        : undefined;
    for (const [segmentId, entry] of Object.entries(
      segmentsMapping.segmentId ?? {},
    )) {
      if (!entry?.geometry) continue;
      if (allowed && !allowed.has(segmentId)) continue;
      features.push({
        type: "Feature",
        geometry: entry.geometry,
        properties: { segmentId, segmentColor: segmentColorById.get(segmentId) },
      });
    }
    return {
      type: "FeatureCollection",
      features,
    } as FeatureCollection<LineString, { segmentId: string; segmentColor?: string }>;
  }, [
    segmentsMapping,
    showSegmentsTab,
    segmentMeasurementField,
    segmentFieldIdSet,
    segmentColorById,
  ]);

  const handleSegmentSelect = (segmentId: string) => {
    navigate({
      search: (s) => ({
        ...s,
        selectedSegment: segmentId,
        dataPanelOpen: true,
      }),
      replace: true,
    });
  };

  function InvalidateSizeOnLayoutChange({ panelOpen }: { panelOpen: boolean }) {
    const map = useMap();
    useEffect(() => {
      if (!map) return;
      map.invalidateSize();
    }, [map, panelOpen]);
    useEffect(() => {
      if (!map) return;
      const container = map.getContainer();
      if (!container) return;
      const observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(container);
      const onResize = () => map.invalidateSize();
      window.addEventListener("resize", onResize);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }, [map]);
    return null;
  }

  return (
    <Box flex={1} h="100%" id="map" style={selectedDateOutline}>
      <MapContainer
        center={[60.1699, 24.9384]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <InvalidateSizeOnLayoutChange panelOpen={Boolean(dataPanelOpen)} />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Taustakartta">
            <WMSTileLayer
              url="https://kartta.hel.fi/ws/geoserver/avoindata/wms?"
              layers="avoindata:Opaskartta_PKS_harmaa"
              format="image/png"
              transparent={false}
              attribution="<a href='https://kartta.hel.fi/avoindata'>Helsingin opaskartta &#169; Helsingin kaupunkiympäristön toimiala / Kaupunkimittauspalvelut</a>"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Ilmakuva">
            <WMSTileLayer
              url="https://kartta.hel.fi/ws/geoserver/avoindata/wms?"
              layers="avoindata:Ortoilmakuva"
              format="image/png"
              transparent={false}
              attribution="<a href='https://kartta.hel.fi/avoindata'>Helsingin ortoilmakuva &#169; Helsingin kaupunkiympäristön toimiala / Kaupunkimittauspalvelut</a>"
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {showAirQuality && (
            <FeatureGroup>
              {filteredAirQualityData && (
                <GeoJSON
                  key={`air-quality-${selectedDate?.toISOString() ?? "now"}`}
                  data={filteredAirQualityData}
                  pointToLayer={(
                    feature: Feature<Geometry, AirQualityProps>,
                    latlng,
                  ) => {
                    const color = getAirQualityColor(
                      feature?.properties?.Ilmanlaatuindeksi,
                    );

                    return L.circleMarker(latlng, {
                      radius: 10,
                      color: theme.black,
                      weight: 1,
                      fillColor: color,
                      fillOpacity: 1,
                      stroke: true,
                      className: "aq-marker",
                    });
                  }}
                  onEachFeature={(
                    feature: Feature<Geometry, AirQualityProps>,
                    layer,
                  ) => {
                    const properties: AirQualityProps =
                      feature.properties ?? {};
                    layer.bindPopup(`
                        <div>
                          <strong>${properties.Mittausasema ?? "Mittausasema"}</strong><br/>
                          ${properties.Mittausaseman_osoite ?? ""}<br/>
                          ${properties.Aika ?? ""}<br/>
                          Indeksi: ${properties.Ilmanlaatuindeksi ?? "-"}
                        </div>
                      `);
                    layer.on("click", () => {
                      const stationId = getAirQualityStationId(feature);
                      if (stationId) {
                        navigate({
                          search: (s) => ({
                            ...s,
                            selectedAirQualityStation: stationId,
                          }),
                          replace: true,
                        });
                      }
                    });
                  }}
                />
              )}
            </FeatureGroup>
          )}

          {showAreaRentals &&
            areaRentalSegmentsFeatureCollection.features.length > 0 && (
              <DisturbanceLayer
                layerKey={`area-rentals-${selectedDate?.toISOString() ?? "all"}`}
                paneName="traffic-segments-area"
                zIndex={650}
                featureCollection={areaRentalSegmentsFeatureCollection}
                selectedSegment={selectedSegment}
                onSegmentSelect={handleSegmentSelect}
              />
            )}

          {showExcavationNotices &&
            excavationSegmentsFeatureCollection.features.length > 0 && (
              <DisturbanceLayer
                layerKey={`excavation-${selectedDate?.toISOString() ?? "all"}`}
                paneName="traffic-segments-exc"
                zIndex={651}
                featureCollection={excavationSegmentsFeatureCollection}
                selectedSegment={selectedSegment}
                onSegmentSelect={handleSegmentSelect}
              />
            )}

          {showSegmentsTab && segmentsFeatureCollection.features.length > 0 && (
            <DisturbanceLayer
              layerKey={`segments-${
                segmentMeasurementField ?? "all"
              }-${segmentsEnd.toISOString()}-${targetDateMs}`}
              paneName="traffic-segments-fcd"
              zIndex={652}
              featureCollection={segmentsFeatureCollection}
              selectedSegment={selectedSegment}
              onSegmentSelect={handleSegmentSelect}
            />
          )}
        </LayersControl>
        {!showSegmentsTab && <AirQualityIndicator />}
        {showSegmentsTab && <SegmentIndicator />}
        <FitMapToSelected
          selectedSegment={selectedSegment}
          featureCollections={
            showSegmentsTab
              ? [segmentsFeatureCollection]
              : [
                  areaRentalSegmentsFeatureCollection,
                  excavationSegmentsFeatureCollection,
                ]
          }
        />
      </MapContainer>
    </Box>
  );
}
