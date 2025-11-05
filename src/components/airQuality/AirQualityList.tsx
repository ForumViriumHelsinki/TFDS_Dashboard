import { Group, Text, Loader } from "@mantine/core";
import { useMemo } from "react";
import { getAirQualityIndicatorColor, getAirQualityStationId } from "../../utils/airQuality";
import type { AirQualityProps } from "../../utils/airQuality";
import { AirQualityItem } from "./AirQualityItem";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AirQualityTypes, getListAirQualityQueryOptions } from "../../queries/air-quality";

export function AirQualityList() {
  const { selectedAirQualityStation } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  
  const { isPending, isError, data, error } = useQuery(
    getListAirQualityQueryOptions({ airQualityType: AirQualityTypes.AIR_QUALITY_NOW }),
  );

  const items = useMemo(() => data?.features ?? [], [data]);

  if (isPending) {
    return (
      <Group p="md">
        <Loader size="sm" />
        <Text>Haetaan ilmanlaatutietoja…</Text>
      </Group>
    );
  }

  if (isError) {
    return (
      <Group p="md">
        <Text c="red">Tietojen haku epäonnistu: {error?.message}.</Text>
      </Group>
    );
  }

  return (
    <>
      {items.map((f) => {
        const p: AirQualityProps = (f.properties ?? {}) as AirQualityProps;
        const id = getAirQualityStationId(f);
        const label = p.Mittausasema ?? "";
        const description = p.Mittausaseman_osoite ?? "";
        const color = getAirQualityIndicatorColor(p.Ilmanlaatuindeksi);
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
