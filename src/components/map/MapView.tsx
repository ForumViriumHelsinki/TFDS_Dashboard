import { Box } from "@mantine/core";
import { MapContainer, TileLayer, LayersControl, WMSTileLayer, FeatureGroup, GeoJSON, useMap } from "react-leaflet";
import { getAirQualityIndicatorColor, AirQualityProps } from "../../utils/airQuality";
import L from "leaflet";
import type { Geometry, Feature, GeoJsonObject } from "geojson";
import { AirQualityIndicator } from "./AirQualityIndicator";
import { useQuery } from "@tanstack/react-query";
import { getListAirQualityQueryOptions } from "../../queries/air-quality";
import { AirQualityTypes } from "../../queries/air-quality";
import { getListLandLeaseQueryOptions, LandLeaseProps, landLeaseTypes } from "../../queries/land-leases";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

export function MapView() {
  const { selectedSegment } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const { data: airQualityData } = useQuery(
    getListAirQualityQueryOptions({ airQualityType: AirQualityTypes.AIR_QUALITY_NOW }),
  );
  const { data: landLeaseData } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.EXCAVATION_NOTICE_AREA }),
  );

  function FitMapToSelected() {
    const map = useMap();
  
    useEffect(() => {
      if (!map || !landLeaseData || !selectedSegment) return;
      const feature = landLeaseData.features.find((feature) => {
        const properties = feature.properties as LandLeaseProps;
        return String(feature.id ?? properties.hakemustunnus ?? 0) === selectedSegment;
      });
      if (!feature) return;
      const bounds = L.geoJSON(feature as GeoJsonObject).getBounds();
      if (bounds.isValid()) {
        const center = bounds.getCenter();
        map.setView(center, map.getZoom(), { animate: true });
      }
    }, [map, landLeaseData, selectedSegment]);
  
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
                    pointToLayer={(feature: Feature<Geometry, AirQualityProps>, latlng) => {
                      const color = getAirQualityIndicatorColor(feature?.properties?.Ilmanlaatuindeksi);
                      return L.circleMarker(latlng, {
                        radius: 8,
                        color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.85,
                      });
                    }}
                    onEachFeature={(feature: Feature<Geometry, AirQualityProps>, layer) => {
                      const properties: AirQualityProps = feature.properties ?? {};
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
                {landLeaseData && (
                  <GeoJSON
                    data={landLeaseData}
                    style={(feature) => {
                      const id = (feature?.id ?? 0);
                      const isSelected = id && String(id) === selectedSegment;
                      return {
                        color: isSelected ? '#F37438' : '#666',
                        weight: isSelected ? 3 : 1,
                        fillColor: isSelected ? '#F37438' : '#666',
                        fillOpacity: isSelected ? 0.35 : 0.15,
                      };
                    }}
                    onEachFeature={(feature, layer) => {
                      layer.on('click', () => {
                        const id = String(feature.id ?? 0);
                        if (id) {
                          navigate({
                            search: (s) => ({ ...s, selectedSegment: id, dataPanelOpen: true }),
                            replace: true,
                          });
                        }
                      });
                    }}
                  />
                )}
              </FeatureGroup>
            </LayersControl.Overlay>
          </LayersControl>
          <AirQualityIndicator />
          <FitMapToSelected />
        </MapContainer>
      </div>
    </Box>
  );
}
