import { Box } from "@mantine/core";
import { MapContainer, TileLayer, LayersControl, WMSTileLayer, FeatureGroup, GeoJSON } from "react-leaflet";
import { getAqiColor, AirQualityProps } from "../../utils/airQuality";
import L from "leaflet";
import type { Geometry, Feature } from "geojson";
import { AirQuailityIndicator } from "./AirQuailityIndicator";
import { useAtomValue } from "jotai";
import { airQualityAtom } from "../../atoms/airQuality";
import type { AlluProps } from "../../atoms/disruptions";
import { disruptionsAtom } from "../../atoms/disruptions";
import { useSearch } from "@tanstack/react-router";

export function MapView() {
  const { airQualityData } = useAtomValue(airQualityAtom);
  const { kaivuilmoitukset } = useAtomValue(disruptionsAtom);
  const { selectedSegment } = useSearch({ from: '/' });
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
                      const isSelected = id && id === selectedSegment;
                      return {
                        color: isSelected ? '#F37438' : '#666',
                        weight: isSelected ? 3 : 1,
                        fillColor: isSelected ? '#F37438' : '#666',
                        fillOpacity: isSelected ? 0.35 : 0.15,
                      };
                    }}
                    onEachFeature={(feature, layer) => {
                      const p = feature.properties as AlluProps;
                      layer.bindPopup(
                        `<strong>${p.osoite ?? 'Kaivuilmoitus'}</strong><br/>${p.hakemustunnus ?? ''}`
                      );
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
