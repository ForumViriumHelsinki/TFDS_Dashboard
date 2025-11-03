import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { Calendar, RefreshCcw } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AirQualityProps, getAirQualityStationId } from "../../utils/airQuality";
import { useAtomValue } from "jotai";
import { airQualityAtom } from "../../atoms/airQuality";

export function DataDisplaySidebar() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { selectedAirQualityStation } = useSearch({ from: '/' })
  const { airQualityData } = useAtomValue(airQualityAtom);
  
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
        onChange={(value) => navigate({ search: (p) => ({ ...p, selectedSegment: value }), replace: true })}
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
        value={selectedAirQualityStation ?? null}
        size="xs"
        variant="filled"
        onChange={(value) => navigate({ search: (p) => ({ ...p, selectedAirQualityStation: value ?? undefined }), replace: true })}
        data={airQualityData?.features?.map((f) => {
          const p: AirQualityProps = (f.properties ?? {}) as AirQualityProps;
          const id = getAirQualityStationId(f);
          return { value: id, label: p.Mittausasema ?? "" };
        }) ?? []}
      />
      <Group gap="xs">
        <Text fw={500} size="sm">Kaupunginosa:</Text>
        <Text size="sm">7 ULLANLINNA</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Hakemus:</Text>
        <Text size="sm">7 Kaivuilmoitus</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Ajankohta:</Text>
        <Text size="sm">28.07.2025 - 31.08.2026</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Tila:</Text>
        <Text size="sm">Käynnissä</Text>
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

