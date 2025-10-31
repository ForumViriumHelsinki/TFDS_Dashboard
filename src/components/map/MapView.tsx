import { Box } from "@mantine/core";
import { MapContainer, TileLayer, LayersControl, WMSTileLayer, FeatureGroup, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import type { FeatureCollection, Geometry, Feature } from "geojson";
import { AirQuailityIndicator } from "./AirQuailityIndicator";

type AirProps = {
  Mittausasema?: string;
  Aika?: string;
  Ilmanlaatuindeksi?: number;
  Mittausaseman_osoite?: string;
};

export function MapView() {
  const [aqData, setAqData] = useState<FeatureCollection<Geometry, AirProps> | null>(null);

  const getAqiColor = (index?: number): string => {
    if (index === undefined || index === null) return "#7e7e7e"; // fallback gray
    if (index <= 50) return "#2ecc71"; // Green - Good
    if (index <= 75) return "#ffd400"; // Yellow - Satisfactory
    if (index <= 100) return "#ff8c00"; // Orange - Passable
    if (index <= 150) return "#c0392b"; // Deep red - Bad
    return "#8e44ad"; // Violet - Very bad
  };

  useEffect(() => {
    const controller = new AbortController();
    const url =
      "/hsy-wfs/geoserver/wfs?version=2.0.0&request=GetFeature&typeNames=Ilmanlaatu_nyt&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326";

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => setAqData(json as FeatureCollection<Geometry, AirProps>))
      .catch((e) => {
        console.warn("HSY WFS fetch failed", e);
      });

    return () => controller.abort();
  }, []);

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
                {aqData && (
                  <GeoJSON
                    data={aqData}
                    pointToLayer={(feature: Feature<Geometry, AirProps>, latlng) => {
                      const idx = feature?.properties?.Ilmanlaatuindeksi;
                      const color = getAqiColor(idx);
                      return L.circleMarker(latlng, {
                        radius: 7,
                        color,
                        weight: 2,
                        fillColor: color,
                        fillOpacity: 0.85,
                      });
                    }}
                    onEachFeature={(feature: Feature<Geometry, AirProps>, layer) => {
                      const p: AirProps = feature.properties || {};
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
          <AirQuailityIndicator />
        </MapContainer>
      </div>
    </Box>
  );
}
