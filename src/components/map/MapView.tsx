/* eslint-disable react/prop-types */
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
  getAirQualityIndicatorColor,
  AirQualityProps,
} from "../../utils/airQuality";
import L from "leaflet";
import type { Geometry, Feature, GeoJsonObject } from "geojson";
import { AirQualityIndicator } from "./AirQualityIndicator";
import { useQuery } from "@tanstack/react-query";
import { getListAirQualityQueryOptions } from "../../queries/air-quality";
import { AirQualityTypes } from "../../queries/air-quality";
import {
  getListLandLeaseQueryOptions,
  landLeaseTypes,
} from "../../queries/land-leases";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import masterSegments from "../../data/master_segment_history.json";
import type { MasterSegmentsById } from "../../types/master-segment";
import trafficDisturbances from "../../data/traffic_disturbance_data.json";
  

export const getTrafficSegmentsFC = () => {
  const source = masterSegments as unknown as MasterSegmentsById;
  const features = Object.entries(source).map(([sid, entry]) => ({
    type: "Feature",
    geometry: entry.current_geometry,
    properties: { segmentId: sid },
  }));
  return { type: "FeatureCollection", features } as GeoJsonObject;
};

export function MapView() {
  const trafficSegmentsFC = getTrafficSegmentsFC();
  const { selectedSegment } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const { data: airQualityData } = useQuery(
    getListAirQualityQueryOptions({
      airQualityType: AirQualityTypes.AIR_QUALITY_NOW,
    })
  );
  const { data: excavationNoticeAreaData } = useQuery(
    getListLandLeaseQueryOptions({
      landLeaseType: landLeaseTypes.EXCAVATION_NOTICE_AREA,
    })
  );
  const { data: landLeaseAreaData } = useQuery(
    getListLandLeaseQueryOptions({
      landLeaseType: landLeaseTypes.LAND_LEASE_AREA,
    })
  );

  // Build disturbance (Kaivuilmoitus/Aluevuokraus) -> segments mapping from traffic_disturbance_data.json
  useEffect(() => {
    type DisturbanceType = "Kaivuilmoitus" | "Aluevuokraus";
    type CollisionProps = {
      traffic_disturbance_type: DisturbanceType;
      traffic_disturbance_id: number;
      application_id: string;
      star_date: string;
      end_date: string;
    };
    type SegmentEntry = {
      geometry: { type: "LineString"; coordinates: [number, number][] };
      detailedCollisions: Array<{ properties: CollisionProps }>;
    };
    type TrafficJson = {
      segmentId: Record<string, SegmentEntry>;
    };
    const src = trafficDisturbances as unknown as TrafficJson;
    const inverted: Record<
      string,
      {
        type: DisturbanceType;
        id: number;
        application_id: string;
        star_date: string;
        end_date: string;
        segments: Record<string, SegmentEntry>;
      }
    > = {};
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
        inverted[key].segments[segmentId] = segment;
      }
    }
    // Only log for now; not wiring into UI yet per request
    // eslint-disable-next-line no-console
    console.log("disturbanceToSegments (inverted from traffic_disturbance_data.json):", inverted);
  }, []);

  function FitMapToSelected() {
    const map = useMap();

    useEffect(() => {
      if (!map || !selectedSegment) return;
      // Center to the selected road segment from trafficSegmentsFC (master_segment_history.json)
      const fc = trafficSegmentsFC as unknown as {
        type: string;
        features?: Array<Feature<Geometry, { segmentId?: string }>>;
      };
      const matched =
        fc.features?.find(
          (f) => f?.properties?.segmentId === selectedSegment
        ) ?? null;
      if (!matched) return;
      const bounds = L.geoJSON(matched as unknown as GeoJsonObject).getBounds();
      if (bounds.isValid()) {
        const center = bounds.getCenter();
        map.setView(center, Math.max(map.getZoom(), 16), { animate: true });
      }
    }, [map, trafficSegmentsFC, selectedSegment]);

    return null;
  }

  return (
    <Box bg="gray.1" flex={1} h="100%">
      <div id="map">
        <MapContainer
          center={[60.1699, 24.9384]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
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

            <LayersControl.Overlay name="Ilmanlaatu nyt" checked>
              <FeatureGroup>
                {airQualityData && (
                  <GeoJSON
                    data={airQualityData}
                    pointToLayer={(
                      feature: Feature<Geometry, AirQualityProps>,
                      latlng
                    ) => {
                      const color = getAirQualityIndicatorColor(
                        feature?.properties?.Ilmanlaatuindeksi
                      );
                      return L.circleMarker(latlng, {
                        radius: 8,
                        color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.85,
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
              <FeatureGroup>
                {excavationNoticeAreaData && (
                  <GeoJSON
                    data={excavationNoticeAreaData}
                    style={{
                      color: "#F37438",
                      weight: 3,
                      fillColor: "#F37438",
                      fillOpacity: 0.35,
                    }}
                  />
                )}
              </FeatureGroup>
              <FeatureGroup>
                {landLeaseAreaData && (
                  <GeoJSON
                    data={landLeaseAreaData}
                    style={{
                      color: "#ff00ff",
                      weight: 3,
                      fillColor: "#ff00ff",
                      fillOpacity: 0.35,
                    }}
                  />
                )}
              </FeatureGroup>
              <Pane name="traffic-segments" style={{ zIndex: 650 }}>
                <FeatureGroup>
                  <GeoJSON
                    pane="traffic-segments"
                    data={trafficSegmentsFC}
                    style={(
                      feature?: Feature<Geometry, { segmentId?: string }>
                    ) => {
                      const sid = feature?.properties?.segmentId;
                      const isSelected = sid && sid === selectedSegment;
                      return {
                        color: isSelected ? "#F37438" : "#00ff00",
                        weight: isSelected ? 4 : 3,
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
                      });
                    }}
                  />
                </FeatureGroup>
              </Pane>
            </LayersControl.Overlay>
          </LayersControl>
          <AirQualityIndicator />
          <FitMapToSelected />
        </MapContainer>
      </div>
    </Box>
  );
}
