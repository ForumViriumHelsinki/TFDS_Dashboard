import { Group, Text, Loader } from "@mantine/core";
import { useMemo } from "react";
import { getAqiColor, getAirStationId } from "../../utils/airQuality";
import type { AirQualityProps } from "../../utils/airQuality";
import { AirQualityItem } from "./AirQualityItem";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { airQualityAtom } from "../../atoms/airQuality";

export function AirQualityList() {
  const { airQualityData, loading, error } = useAtomValue(airQualityAtom);
  const { selectedAirQualityStation } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const items = useMemo(() => airQualityData?.features ?? [], [airQualityData]);

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
        const p: AirQualityProps = (f.properties ?? {}) as AirQualityProps;
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
