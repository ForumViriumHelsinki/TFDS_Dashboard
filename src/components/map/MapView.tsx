import { Box } from "@mantine/core";
import { MapContainer, TileLayer, LayersControl, WMSTileLayer, FeatureGroup, GeoJSON } from "react-leaflet";
import { getAirQualityIndicatorColor, AirQualityProps } from "../../utils/airQuality";
import L from "leaflet";
import type { Geometry, Feature } from "geojson";
import { AirQualityIndicator } from "./AirQualityIndicator";
import { useAtomValue } from "jotai";
import { airQualityAtom } from "../../atoms/airQuality";


export function MapView() {
  const { airQualityData } = useAtomValue(airQualityAtom);
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
                      const color = getAirQualityIndicatorColor(idx);
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
            </LayersControl.Overlay>
          </LayersControl>
          <AirQualityIndicator />
        </MapContainer>
      </div>
    </Box>
  );
}
