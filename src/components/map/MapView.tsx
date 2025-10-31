import { Box } from "@mantine/core";
import { MapContainer, TileLayer, LayersControl, WMSTileLayer, FeatureGroup, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import type { FeatureCollection, Geometry, Feature } from "geojson";

type AirProps = {
  Mittausasema?: string;
  Aika?: string;
  Ilmanlaatuindeksi?: number;
  Mittausaseman_osoite?: string;
};

export function MapView() {
  const [aqData, setAqData] = useState<FeatureCollection<Geometry, AirProps> | null>(null);

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
                    pointToLayer={(_feature: Feature<Geometry, AirProps>, latlng) =>
                      L.circleMarker(latlng, {
                        radius: 6,
                        color: "#ff6b00",
                        weight: 2,
                        fillColor: "#ffb000",
                        fillOpacity: 0.8,
                      })
                    }
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
        </MapContainer>
      </div>
    </Box>
  );
}
