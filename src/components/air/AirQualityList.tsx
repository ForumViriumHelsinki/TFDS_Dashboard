import { Group, Text, Loader } from "@mantine/core";
import { useMemo, useState } from "react";
import { useAirQualityData, getAqiColor } from "../../hooks/useAirQualityData";
import type { AirProps } from "../../hooks/useAirQualityData";
import { AirQualityItem } from "./AirQualityItem";

export function AirQualityList() {
  const { data, loading, error } = useAirQualityData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        const id = String(f.id ?? p.Mittausaseman_numero ?? p.Mittausasema ?? "");
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
            isSelected={selectedId === id}
            onClick={() => setSelectedId(id)}
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


