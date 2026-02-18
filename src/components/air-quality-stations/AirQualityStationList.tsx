import { Group, Text, Loader } from "@mantine/core";
import { useMemo } from "react";
import { getAirQualityStationId } from "../../utils/airQuality";
import { getAirQualityColor } from "../../utils/colors";
import { AirQualityStationItem } from "./AirQualityStationItem";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useFilteredAirQuality } from "../../hooks/useFilteredAirQuality";

export function AirQualityStationList() {
  const { selectedAirQualityStation, selectedDate } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });

  const { isPending, isError, data, error } =
    useFilteredAirQuality(selectedDate);

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
        <Text c="red">Tietojen haku epäonnistui: {error?.message}.</Text>
      </Group>
    );
  }

  return (
    <>
      {items.map((feature) => {
        const properties = feature.properties ?? {};
        const id = getAirQualityStationId(feature);
        return (
          <AirQualityStationItem
            key={id}
            id={id}
            label={properties.Mittausasema ?? ""}
            description={properties.Mittausaseman_osoite ?? ""}
            colorHex={getAirQualityColor(properties.Ilmanlaatuindeksi)}
            isSelected={selectedAirQualityStation === id}
            onClick={() =>
              navigate({
                search: (prev) => ({
                  ...prev,
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
