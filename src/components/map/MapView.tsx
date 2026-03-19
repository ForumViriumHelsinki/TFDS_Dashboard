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
import { useEffect, useMemo, useRef } from "react";
import {
  buildSegmentsFeatureCollection,
  buildSegmentsMappingFeatureCollection,
} from "../../utils/invertTrafficDisturbances";
import { useMergedDisturbances } from "../../hooks/useMergedDisturbances";
import { Sources } from "../../router";
import { useFilteredAirQuality } from "../../hooks/useFilteredAirQuality";
import { SegmentLayer } from "./SegmentLayer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFloatingCarDataNearestBySegmentQueryOptions } from "../../queries/floating-car-data";
import { getSegmentsMappingQueryOptions } from "../../queries/traffic-disturbances";
import { getAqiTimeSeriesByStationQueryOptions } from "../../queries/aqi";
import type { LineString } from "geojson";
import {
  getSegmentMeasurementFieldConfig,
  getSegmentMeasurementFieldQueryField,
  usesSpeedLimitBaseline,
} from "../../constants/segment-fields";
import {
  getAirQualityColor,
  getSegmentColorForValue,
} from "../../utils/colors";
import { getDefaultDateRange } from "../../utils/time";
import { getSegmentSpeedLimitsQueryOptions } from "../../queries/segment-speed-limits";

const SEGMENT_NO_DATA_COLOR = "#9CA3AF";

function FitMapToSelected({
  selectedSegment,
  featureCollections,
}: {
  selectedSegment?: string;
  featureCollections: FeatureCollection[];
}) {
  const map = useMap();
  const lastPannedSegmentRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedSegment) {
      lastPannedSegmentRef.current = undefined;
      return;
    }
    if (!map) return;
    if (lastPannedSegmentRef.current === selectedSegment) return;

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
      lastPannedSegmentRef.current = selectedSegment;
    }
  }, [map, selectedSegment, featureCollections]);

  return null;
}

export function MapView() {
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const {
    selectedSegment,
    selectedDate,
    dataPanelOpen,
    sources,
    activeTab,
    segmentMeasurementField,
    selectedStartDate,
    selectedEndDate,
    selectedDateMode,
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
      selectedDateMode: s.selectedDateMode,
    }),
  });
  const navigate = useNavigate({ from: "/" });
  const showSegmentsTab = activeTab === "Segmentit";
  const enabledSources = sources ?? [];
  const showAirQuality = enabledSources.includes(Sources.AIR_QUALITY);
  const showAreaRentals =
    !showSegmentsTab && enabledSources.includes(Sources.AREA_RENTALS);
  const showExcavationNotices =
    !showSegmentsTab && enabledSources.includes(Sources.EXCAVATION_NOTICES);
  const showDisturbanceLayers = showAreaRentals || showExcavationNotices;
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

  const fallbackRange = useMemo(() => getDefaultDateRange(), []);
  const effectiveEnd = selectedEndDate ?? fallbackRange.end;
  const effectiveStart = selectedStartDate ?? fallbackRange.start;
  const displayDate = selectedDate ?? effectiveEnd;
  const { data: filteredAirQualityData } = useFilteredAirQuality(
    displayDate,
    selectedDateMode,
    Boolean(showAirQuality),
  );
  const segmentQueryTargetDate = displayDate;
  const { start: segmentsStart, end: segmentsEnd } = useMemo(() => {
    return { start: effectiveStart, end: effectiveEnd };
  }, [effectiveEnd, effectiveStart]);
  const selectedDateOutline = {
    border: `1px dashed ${theme.colors.brand[0]}`,
    borderOffset: "-1px",
  };

  const { data: segmentsMapping } = useQuery(getSegmentsMappingQueryOptions());
  const { data: speedLimits, isPending: isSpeedLimitsPending } = useQuery(
    getSegmentSpeedLimitsQueryOptions(),
  );
  const selectedQueryField = getSegmentMeasurementFieldQueryField(
    segmentMeasurementField,
  );
  const selectedFieldUsesSpeedLimit = usesSpeedLimitBaseline(
    segmentMeasurementField,
  );
  const {
    data: segmentRows,
    dataUpdatedAt: segmentRowsUpdatedAt,
    isFetching: isSegmentRowsFetching,
  } = useQuery({
    ...getFloatingCarDataNearestBySegmentQueryOptions({
      start: segmentsStart,
      end: segmentsEnd,
      field: selectedQueryField,
      target: segmentQueryTargetDate,
    }),
    enabled: Boolean(showSegmentsTab),
    placeholderData: (previousData) => previousData,
  });

  const targetDateMs = segmentQueryTargetDate.getTime();

  const speedLimitBySegmentId = useMemo(() => {
    const values = new Map<string, number>();
    for (const [segmentId, entry] of Object.entries(
      speedLimits?.segmentId ?? {},
    )) {
      if (!Number.isFinite(entry.speedLimit) || entry.speedLimit <= 0) continue;
      values.set(segmentId, entry.speedLimit);
    }
    return values;
  }, [speedLimits]);

  const segmentFieldValueById = useMemo(() => {
    const values = new Map<string, number>();
    if (!Array.isArray(segmentRows)) {
      return values;
    }

    for (const row of segmentRows) {
      const segmentId = row.segmentId?.trim();
      if (!segmentId || !Number.isFinite(row.value)) continue;
      if (selectedFieldUsesSpeedLimit) {
        const speedLimit = speedLimitBySegmentId.get(segmentId);
        if (!Number.isFinite(speedLimit) || !speedLimit || speedLimit <= 0) {
          continue;
        }
        values.set(segmentId, Math.min(row.value / speedLimit, 1));
        continue;
      }

      values.set(segmentId, row.value);
    }

    return values;
  }, [segmentRows, selectedFieldUsesSpeedLimit, speedLimitBySegmentId]);

  const segmentFieldConfig = useMemo(
    () => getSegmentMeasurementFieldConfig(segmentMeasurementField),
    [segmentMeasurementField],
  );

  const segmentColorById = useMemo(() => {
    const colors = new Map<string, string>();
    if (
      showSegmentsTab &&
      (isSegmentRowsFetching ||
        (selectedFieldUsesSpeedLimit && isSpeedLimitsPending))
    ) {
      return colors;
    }
    if (
      !showSegmentsTab ||
      !segmentFieldConfig ||
      segmentFieldValueById.size === 0
    ) {
      return colors;
    }

    const colorMaxValue =
      segmentFieldConfig.colorMaxValue ?? segmentFieldConfig.yMax;
    for (const [segmentId, value] of segmentFieldValueById.entries()) {
      colors.set(segmentId, getSegmentColorForValue(value, colorMaxValue));
    }

    return colors;
  }, [
    showSegmentsTab,
    isSegmentRowsFetching,
    isSpeedLimitsPending,
    segmentFieldConfig,
    segmentFieldValueById,
    selectedFieldUsesSpeedLimit,
  ]);

  const segmentsFeatureCollection = useMemo(() => {
    const featureCollection = buildSegmentsMappingFeatureCollection(
      segmentsMapping,
      segmentColorById,
    );

    return {
      ...featureCollection,
      features: featureCollection.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          segmentColor:
            feature.properties.segmentColor ?? SEGMENT_NO_DATA_COLOR,
        },
      })),
    } as FeatureCollection<
      LineString,
      { segmentId: string; segmentColor?: string }
    >;
  }, [segmentsMapping, segmentColorById]);

  const allMappedSegmentsFeatureCollection = useMemo(
    () => buildSegmentsMappingFeatureCollection(segmentsMapping),
    [segmentsMapping],
  );

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
                      const stationName = String(
                        feature.properties?.Mittausasema ?? "",
                      ).trim();

                      if (stationName) {
                        const queryOptions =
                          getAqiTimeSeriesByStationQueryOptions({
                            start: segmentsStart,
                            end: segmentsEnd,
                            stationName,
                          });
                        void queryClient.fetchQuery({
                          ...queryOptions,
                          staleTime: 0,
                        });
                      }

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

          {showDisturbanceLayers &&
            allMappedSegmentsFeatureCollection.features.length > 0 && (
              <SegmentLayer
                layerKey="all-mapped-segments-background"
                paneName="traffic-segments-background"
                zIndex={649}
                featureCollection={allMappedSegmentsFeatureCollection}
                onSegmentSelect={handleSegmentSelect}
                interactive={false}
                defaultColor="#94A3B8"
                weight={4}
                selectedWeight={4}
                opacity={0.75}
                shadow={false}
              />
            )}

          {showAreaRentals &&
            areaRentalSegmentsFeatureCollection.features.length > 0 && (
              <SegmentLayer
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
              <SegmentLayer
                layerKey={`excavation-${selectedDate?.toISOString() ?? "all"}`}
                paneName="traffic-segments-exc"
                zIndex={651}
                featureCollection={excavationSegmentsFeatureCollection}
                selectedSegment={selectedSegment}
                onSegmentSelect={handleSegmentSelect}
              />
            )}

          {showSegmentsTab && segmentsFeatureCollection.features.length > 0 && (
            <SegmentLayer
              layerKey={`segments-${
                segmentMeasurementField
              }-${segmentsEnd.toISOString()}-${targetDateMs}-${segmentRowsUpdatedAt}`}
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
