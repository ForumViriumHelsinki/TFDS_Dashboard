import { Box } from "@mantine/core";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  WMSTileLayer,
  FeatureGroup,
  GeoJSON,
  useMap,
  Pane,
} from "react-leaflet";
import {
  getAirQualityColor,
  AirQualityProps,
} from "../../utils/airQuality";
import L from "leaflet";
import type { Geometry, Feature, GeoJsonObject } from "geojson";
import { AirQualityIndicator } from "./AirQualityIndicator";
import { useQuery } from "@tanstack/react-query";
import { getListAirQualityQueryOptions } from "../../queries/air-quality";
import { AirQualityTypes } from "../../queries/air-quality";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { buildSegmentsFeatureCollection } from "../../utils/invertTrafficDisturbances";
import { useMergedDisturbances } from "../../hooks/useMergedDisturbances";
import { useMemo } from "react";
import { Sources } from "../../router";

export function MapView() {
  const { selectedSegment } = useSearch({ from: "/" });
  const { dataPanelOpen } = useSearch({ from: "/" });
  const { sources } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const showAirQuality = sources?.includes(Sources.AIR_QUALITY);
  const showAreaRentals = sources?.includes(Sources.AREA_RENTALS);
  const showExcavationNotices = sources?.includes(Sources.EXCAVATION_NOTICES);
  const { map: disturbanceMap } = useMergedDisturbances();
  const areaRentalSegmentsFC = useMemo(() => {
    const entries = Object.entries(disturbanceMap).filter(
      ([, group]) => group.type === "Aluevuokraus"
    );
    return buildSegmentsFeatureCollection(Object.fromEntries(entries));
  }, [disturbanceMap]);
  const excavationSegmentsFC = useMemo(() => {
    const entries = Object.entries(disturbanceMap).filter(
      ([, group]) => group.type === "Kaivuilmoitus"
    );
    return buildSegmentsFeatureCollection(Object.fromEntries(entries));
  }, [disturbanceMap]);

  const { data: airQualityData } = useQuery({
    ...getListAirQualityQueryOptions({
      airQualityType: AirQualityTypes.AIR_QUALITY_NOW,
    }),
    enabled: Boolean(showAirQuality),
  });

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

  function FitMapToSelected() {
    const map = useMap();

    useEffect(() => {
      if (!map || !selectedSegment) return;
      const allFeatures: Array<Feature<Geometry, { segmentId?: string }>> = [
        ...((areaRentalSegmentsFC.features as Array<Feature<Geometry, { segmentId?: string }>> | undefined) ?? []),
        ...((excavationSegmentsFC.features as Array<Feature<Geometry, { segmentId?: string }>> | undefined) ?? []),
      ];
      const matched = allFeatures.find(
        (f) => f?.properties?.segmentId === selectedSegment
      ) ?? null;
      if (!matched) return;
      const bounds = L.geoJSON(matched as unknown as GeoJsonObject).getBounds();
      if (bounds.isValid()) {
        const center = bounds.getCenter();
        map.panTo(center, { animate: true });
      }
    });

    return null;
  }

  return (
    <Box bg="gray.1" flex={1} h="100%" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div id="map" style={{ flex: 1 }}>
        <MapContainer
          center={[60.1699, 24.9384]}
          zoom={15}
          scrollWheelZoom={false}
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
                {airQualityData && (
                  <GeoJSON
                    data={airQualityData}
                    pointToLayer={(
                      feature: Feature<Geometry, AirQualityProps>,
                      latlng
                    ) => {
                      const color = getAirQualityColor(
                        feature?.properties?.Ilmanlaatuindeksi
                      );
                      return L.circleMarker(latlng, {
                        radius: 10,
                        color: "#000000",
                        weight: 1,
                        fillColor: color,
                        fillOpacity: 1,
                        stroke: true,
                        className: "aq-marker",
                      });
                    }}
                    onEachFeature={(
                      feature: Feature<Geometry, AirQualityProps>,
                      layer
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
                    }}
                  />
                )}
              </FeatureGroup>
            )}

            {showAreaRentals && areaRentalSegmentsFC.features.length > 0 && (
              <Pane name="traffic-segments-area" style={{ zIndex: 650 }}>
                <FeatureGroup>
                  <GeoJSON
                    pane="traffic-segments-area"
                    data={areaRentalSegmentsFC}
                    style={(
                      feature?: Feature<Geometry, { segmentId?: string }>
                    ) => {
                      const sid = feature?.properties?.segmentId;
                      const isSelected = sid && sid === selectedSegment;
                      return {
                        color: "#FF5000",
                        weight: isSelected ? 12 : 6,
                        opacity: isSelected ? 1 : 0.5,
                      };
                    }}
                    onEachFeature={(
                      feature: Feature<Geometry, { segmentId?: string }>,
                      layer
                    ) => {
                      layer.on("click", () => {
                        const segmentId = feature.properties?.segmentId;
                        if (segmentId) {
                          navigate({
                            search: (s) => ({
                              ...s,
                              selectedSegment: segmentId,
                              dataPanelOpen: true,
                            }),
                            replace: true,
                          });
                        }
                        layer.bindPopup(`
                          <div>
                            ${Object.entries(feature.properties ?? {}).map(([key, value]) => `${key}: ${value}`).join("<br/>")}
                          </div>
                        `);
                      });
                    }}
                  />
                </FeatureGroup>
              </Pane>
            )}

            {showExcavationNotices && excavationSegmentsFC.features.length > 0 && (
              <Pane name="traffic-segments-exc" style={{ zIndex: 651 }}>
                <FeatureGroup>
                  <GeoJSON
                    pane="traffic-segments-exc"
                    data={excavationSegmentsFC}
                    style={(
                      feature?: Feature<Geometry, { segmentId?: string }>
                    ) => {
                      const sid = feature?.properties?.segmentId;
                      const isSelected = sid && sid === selectedSegment;
                      return {
                        color: "#FF5000",
                        weight: isSelected ? 12 : 6,
                        opacity: isSelected ? 1 : 0.5,
                      };
                    }}
                    onEachFeature={(
                      feature: Feature<Geometry, { segmentId?: string }>,
                      layer
                    ) => {
                      layer.on("click", () => {
                        const segmentId = feature.properties?.segmentId;
                        if (segmentId) {
                          navigate({
                            search: (s) => ({
                              ...s,
                              selectedSegment: segmentId,
                              dataPanelOpen: true,
                            }),
                            replace: true,
                          });
                        }
                        layer.bindPopup(`
                          <div>
                            ${Object.entries(feature.properties ?? {}).map(([key, value]) => `${key}: ${value}`).join("<br/>")}
                          </div>
                        `);
                      });
                    }}
                  />
                </FeatureGroup>
              </Pane>
            )}
          </LayersControl>
          <AirQualityIndicator />
          <FitMapToSelected />
        </MapContainer>
      </div>
    </Box>
  );
}
