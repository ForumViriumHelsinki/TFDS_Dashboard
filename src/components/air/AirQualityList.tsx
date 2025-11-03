import { Group, Text, Loader } from "@mantine/core";
import { useMemo } from "react";
import {
  useAirQualityData,
  getAqiColor,
  getAirStationId,
} from "../../hooks/useAirQualityData";
import type { AirProps } from "../../hooks/useAirQualityData";
import { AirQualityItem } from "./AirQualityItem";
import { useNavigate, useSearch } from "@tanstack/react-router";

export function AirQualityList() {
  const { data, loading, error } = useAirQualityData();
  const { selectedAirQualityStation } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const items = useMemo(() => data?.features ?? [], [data]);

  if (loading) {
    return (
      <Group p="md">
        <Loader size="sm" />
        <Text>Haetaan ilmanlaatutietoja…</Text>
      </Group>
    );
  }

  if (error) {
    return (
      <Group p="md">
        <Text c="red">Tietojen haku epäonnistui.</Text>
      </Group>
    );
  }

  return (
    <>
      {items.map((f) => {
        const p: AirProps = (f.properties ?? {}) as AirProps;
        const id = getAirStationId(f);
        const label = p.Mittausasema ?? "";
        const description = p.Mittausaseman_osoite ?? "";
        const color = getAqiColor(p.Ilmanlaatuindeksi);
        return (
          <AirQualityItem
            key={id}
            id={id}
            label={label}
            description={description}
            colorHex={color}
            isSelected={selectedAirQualityStation === id}
            onClick={() =>
              navigate({
                search: (p) => ({
                  ...p,
                  selectedAirQualityStation: id,
                  dataPanelOpen: true,
                }),
                replace: true,
              })
            }
          />
        );
      })}
      {items.length === 0 && (
        <Group p="md">
          <Text>Ei näytettäviä mittausasemia.</Text>
        </Group>
      )}
    </>
  );
}
