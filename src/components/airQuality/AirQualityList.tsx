import { Group, Text, Loader } from "@mantine/core";
import { useMemo } from "react";
import { getAirQualityIndicatorColor, getAirQualityStationId } from "../../utils/airQuality";
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
          <AirQualityItem
            key={id}
            id={id}
            label={properties.Mittausasema ?? ""}
            description={properties.Mittausaseman_osoite ?? ""}
            colorHex={getAirQualityIndicatorColor(properties.Ilmanlaatuindeksi)}
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
