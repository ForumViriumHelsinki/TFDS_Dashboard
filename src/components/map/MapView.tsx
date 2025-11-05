import { Box } from "@mantine/core";
import { MapContainer, TileLayer, LayersControl, WMSTileLayer, FeatureGroup, GeoJSON, useMap } from "react-leaflet";
import { getAqiColor, AirQualityProps } from "../../utils/airQuality";
import L from "leaflet";
import type { Geometry, Feature } from "geojson";
import type { GeoJsonObject } from "geojson";
import { AirQuailityIndicator } from "./AirQuailityIndicator";
import { useAtomValue } from "jotai";
import { airQualityAtom } from "../../atoms/airQuality";
import type { AlluProps } from "../../atoms/disruptions";
import { disruptionsAtom } from "../../atoms/disruptions";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

function FitMapToSelected() {
  const map = useMap();
  const { selectedSegment } = useSearch({ from: "/" });
  const { kaivuilmoitukset } = useAtomValue(disruptionsAtom);

  useEffect(() => {
    if (!map || !kaivuilmoitukset || !selectedSegment) return;
    const feature = kaivuilmoitukset.features.find((f) => {
      const p = f.properties as AlluProps;
      return String(f.id ?? p.hakemustunnus ?? 0) === selectedSegment;
    });
    if (!feature) return;
    const bounds = L.geoJSON(feature as GeoJsonObject).getBounds();
    if (bounds.isValid()) {
      const center = bounds.getCenter();
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [map, kaivuilmoitukset, selectedSegment]);

  return null;
}

export function MapView() {
  const { airQualityData } = useAtomValue(airQualityAtom);
  const { kaivuilmoitukset } = useAtomValue(disruptionsAtom);
  const { selectedSegment } = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  return (
    <Box bg="gray.1" flex={1} h="100%">
      <div id="map">
        <MapContainer
          center={[60.1699, 24.9384]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <FitMapToSelected />
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
                      const idx = feature?.properties?.Ilmanlaatuindeksi;
                      const color = getAqiColor(idx);
                      return L.circleMarker(latlng, {
                        radius: 8,
                        color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.85,
                      });
                    }}
                    onEachFeature={(feature: Feature<Geometry, AirQualityProps>, layer) => {
                      const p: AirQualityProps = feature.properties || {};
                      const html = `
                        <div>
                          <strong>${p.Mittausasema ?? "Mittausasema"}</strong><br/>
                          ${p.Mittausaseman_osoite ?? ""}<br/>
                          ${p.Aika ?? ""}<br/>
                          Indeksi: ${p.Ilmanlaatuindeksi ?? "-"}
                        </div>`;
                      layer.bindPopup(html);
                    }}
                  />
                )}
              </FeatureGroup>
              <FeatureGroup>
                {kaivuilmoitukset && (
                  <GeoJSON
                    data={kaivuilmoitukset}
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
          <AirQuailityIndicator />
        </MapContainer>
      </div>
    </Box>
  );
}
