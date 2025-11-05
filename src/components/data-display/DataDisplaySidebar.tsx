import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { Calendar, RefreshCcw } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { getAirQualityStationId } from "../../utils/airQuality";
import { AirQualityTypes, getListAirQualityQueryOptions } from "../../queries/air-quality";
import { useQuery } from "@tanstack/react-query";

export function DataDisplaySidebar() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { selectedAirQualityStation } = useSearch({ from: '/' })
  const { isPending, data} = useQuery(
    getListAirQualityQueryOptions({ airQualityType: AirQualityTypes.AIR_QUALITY_NOW }),
  );
  
  return (
    <Stack
      p="md"
      h="100%"
      gap="xs"
      miw={300}
      style={{ borderRight: "1px solid #F1F3F5" }}
    >
      <Select
        label="IDEA Segment"
        placeholder="Valitse IDEA Segment"
        value={selectedSegment}
        size="xs"
        variant="filled"
        onChange={(value) => navigate({ search: (prev) => ({ ...prev, selectedSegment: value }), replace: true })}
        data={Array(60)
          .fill(0)
          .map((_, index) => `1195756141337706496${index + 1}`)}
      />
      <DateTimePicker
        label="Mittausaikaväli"
        placeholder="Valitse aikaväli"
        leftSection={<Calendar size={12} />}
        value={new Date("2025-07-28")}
        size="xs"
        variant="filled"
        clearable
      />
      <Select
        label="Ilmanlaadun mittauspiste"
        placeholder="Valitse mittauspiste"
        disabled={isPending}
        value={selectedAirQualityStation ?? null}
        size="xs"
        variant="filled"
        onChange={(value) => navigate({ search: (prev) => ({ ...prev, selectedAirQualityStation: value ?? undefined }), replace: true })}
        data={(data?.features ?? []).map((feature) => {
          const properties = (feature.properties ?? {});
          const id = getAirQualityStationId(feature);
          return { value: id, label: properties.Mittausasema ?? "" };
        })}
      />
      <Group gap="xs">
        <Text fw={500} size="sm">Kaupunginosa:</Text>
        <Text size="sm">{selectedAllu?.properties?.kaupunginosa ?? "Unknown"}</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Hakemus:</Text>
        <Text size="sm">{selectedAllu?.properties?.hakemustunnus ?? "Unknown"}</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Ajankohta:</Text>
        <Text size="sm">{selectedAllu?.properties?.tyo_alkaa_txt ?? "Unknown"} - {selectedAllu?.properties?.tyo_paattyy_txt ?? "Unknown"}</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Tila:</Text>
        <Text size="sm">{selectedAllu?.properties?.status ?? "Unknown"}</Text>
      </Group>
      <Button
        size="xs"
        variant="white"
        onClick={() => {}}
        color="black"
        leftSection={<RefreshCcw size={12} />}
      >
        Päivitä
      </Button>
    </Stack>
  );
}

