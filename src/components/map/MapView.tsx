import { Alert, Box, useMantineTheme } from "@mantine/core";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  WMSTileLayer,
  FeatureGroup,
  GeoJSON,
  Pane,
  useMap,
} from "react-leaflet";
import {
  AirQualityProps,
  getAirQualityStationId,
  getAirQualityStationName,
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
  buildPolygonFeatureCollection,
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
  isRelativeSpeedField,
} from "../../constants/segment-fields";
import {
  getAirQualityColor,
  getSegmentColorForValue,
} from "../../utils/colors";
import { getDefaultDateRange } from "../../utils/time";

const SEGMENT_NO_DATA_COLOR = "#9CA3AF";

// Escape values from the external HSY WFS API before interpolating them into
// the Leaflet popup's innerHTML, to prevent XSS from unexpected/malicious
// upstream content.
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escapeHtml = (value: unknown): string =>
  String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

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
  const showAreaRentals = enabledSources.includes(Sources.AREA_RENTALS);
  const showExcavationNotices =
    !showSegmentsTab && enabledSources.includes(Sources.EXCAVATION_NOTICES);
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

  const areaRentalPolygons = useMemo(() => {
    const entries = Object.entries(disturbanceMap).filter(
      ([, group]) => group.type === "Aluevuokraus",
    );
    return buildPolygonFeatureCollection(Object.fromEntries(entries));
  }, [disturbanceMap]);
  const excavationPolygons = useMemo(() => {
    const entries = Object.entries(disturbanceMap).filter(
      ([, group]) => group.type === "Kaivuilmoitus",
    );
    return buildPolygonFeatureCollection(Object.fromEntries(entries));
  }, [disturbanceMap]);

  const fallbackRange = useMemo(() => getDefaultDateRange(), []);
  const effectiveEnd = selectedEndDate ?? fallbackRange.end;
  const effectiveStart = selectedStartDate ?? fallbackRange.start;
  const displayDate = selectedDate ?? effectiveEnd;
  const {
    data: filteredAirQualityData,
    isError: airQualityIsError,
    error: airQualityError,
  } = useFilteredAirQuality(
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
  const isRelativeSpeed = isRelativeSpeedField(segmentMeasurementField);
  const selectedQueryField = getSegmentMeasurementFieldQueryField(
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
      field: isRelativeSpeed ? "currentSpeed" : selectedQueryField,
      target: segmentQueryTargetDate,
    }),
    enabled: Boolean(showSegmentsTab),
    placeholderData: (previousData) => previousData,
  });
  const { data: typicalSpeedRows, isFetching: isTypicalSpeedFetching } =
    useQuery({
      ...getFloatingCarDataNearestBySegmentQueryOptions({
        start: segmentsStart,
        end: segmentsEnd,
        field: "typicalSpeed",
        target: segmentQueryTargetDate,
      }),
      enabled: Boolean(showSegmentsTab && isRelativeSpeed),
      placeholderData: (previousData) => previousData,
    });

  const targetDateMs = segmentQueryTargetDate.getTime();

  const segmentFieldValueById = useMemo(() => {
    const values = new Map<string, number>();
    if (!Array.isArray(segmentRows)) {
      return values;
    }

    if (isRelativeSpeed) {
      const typicalBySegment = new Map<string, number>();
      for (const row of typicalSpeedRows ?? []) {
        if (row.segmentId && Number.isFinite(row.value)) {
          typicalBySegment.set(row.segmentId.trim(), row.value);
        }
      }
      for (const row of segmentRows) {
        const segmentId = row.segmentId?.trim();
        if (!segmentId || !Number.isFinite(row.value)) continue;
        const typical = typicalBySegment.get(segmentId);
        if (!typical || typical <= 0) continue;
        values.set(segmentId, (row.value / typical) * 100);
      }
      return values;
    }

    for (const row of segmentRows) {
      const segmentId = row.segmentId?.trim();
      if (!segmentId || !Number.isFinite(row.value)) continue;
      values.set(segmentId, row.value);
    }

    return values;
  }, [segmentRows, typicalSpeedRows, isRelativeSpeed]);

  const segmentFieldConfig = useMemo(
    () => getSegmentMeasurementFieldConfig(segmentMeasurementField),
    [segmentMeasurementField],
  );

  const segmentColorById = useMemo(() => {
    const colors = new Map<string, string>();
    if (
      showSegmentsTab &&
      (isSegmentRowsFetching || (isRelativeSpeed && isTypicalSpeedFetching))
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

    const colorMaxValue = segmentFieldConfig.yMax;
    for (const [segmentId, value] of segmentFieldValueById.entries()) {
      colors.set(segmentId, getSegmentColorForValue(value, colorMaxValue));
    }

    return colors;
  }, [
    showSegmentsTab,
    isSegmentRowsFetching,
    isRelativeSpeed,
    isTypicalSpeedFetching,
    segmentFieldConfig,
    segmentFieldValueById,
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
    <Box
      flex={1}
      h="100%"
      id="map"
      style={{ ...selectedDateOutline, position: "relative" }}
    >
      {showAirQuality && airQualityIsError && (
        <Alert
          color="yellow"
          variant="filled"
          title="Ilmanlaatutiedot eivät ole saatavilla"
          radius="md"
          withCloseButton={false}
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            maxWidth: 420,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          Mittausasemia ei voitu ladata. Kartta toimii muuten normaalisti.
          {airQualityError?.message ? ` (${airQualityError.message})` : ""}
        </Alert>
      )}
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
            <Pane name="air-quality-markers" style={{ zIndex: 660 }}>
              <FeatureGroup>
                {filteredAirQualityData && (
                  <GeoJSON
                    key={`air-quality-${selectedDate?.toISOString() ?? "now"}`}
                    data={filteredAirQualityData}
                    pane="air-quality-markers"
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
                        pane: "air-quality-markers",
                      });
                    }}
                    onEachFeature={(
                      feature: Feature<Geometry, AirQualityProps>,
                      layer,
                    ) => {
                      const properties: AirQualityProps =
                        feature.properties ?? {};
                      const stationName = getAirQualityStationName(feature);
                      layer.bindPopup(`
                        <div>
                          <strong>${escapeHtml(stationName || "Mittausasema")}</strong><br/>
                          ${escapeHtml(properties.Mittausaseman_osoite ?? "")}<br/>
                          ${escapeHtml(properties.Aika ?? "")}<br/>
                          Indeksi: ${escapeHtml(properties.Ilmanlaatuindeksi ?? "-")}
                        </div>
                      `);
                      layer.on("click", () => {
                        const stationId = getAirQualityStationId(feature);

                        if (stationName) {
                          const queryOptions =
                            getAqiTimeSeriesByStationQueryOptions({
                              start: segmentsStart,
                              end: segmentsEnd,
                              stationName,
                            });
                          // prefetchQuery (not fetchQuery) — we only warm the
                          // cache here and don't use the result, and it swallows
                          // errors internally instead of producing an unhandled
                          // promise rejection on network failure.
                          void queryClient.prefetchQuery({
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
            </Pane>
          )}

          {showAreaRentals && areaRentalPolygons.features.length > 0 && (
            <Pane name="area-rental-polygons" style={{ zIndex: 648 }}>
              <GeoJSON
                key={`area-rental-polygons-${selectedDate?.toISOString() ?? "all"}`}
                data={areaRentalPolygons}
                style={{
                  fillColor: "#FCA5A5",
                  fillOpacity: 0.2,
                  color: "#EF4444",
                  weight: 2,
                  opacity: 0.5,
                }}
              />
            </Pane>
          )}

          {showExcavationNotices && excavationPolygons.features.length > 0 && (
            <Pane name="excavation-polygons" style={{ zIndex: 648 }}>
              <GeoJSON
                key={`excavation-polygons-${selectedDate?.toISOString() ?? "all"}`}
                data={excavationPolygons}
                style={{
                  fillColor: "#FCA5A5",
                  fillOpacity: 0.2,
                  color: "#EF4444",
                  weight: 2,
                  opacity: 0.5,
                }}
              />
            </Pane>
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
