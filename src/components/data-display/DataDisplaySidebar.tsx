import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { Calendar, RefreshCcw } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { getAirQualityStationId } from "../../utils/airQuality";
import { AirQualityTypes, getListAirQualityQueryOptions } from "../../queries/air-quality";
import { useQuery } from "@tanstack/react-query";
import { getListLandLeaseQueryOptions, LandLeaseProps, landLeaseTypes } from "../../queries/land-leases";

export function DataDisplaySidebar() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { selectedAirQualityStation } = useSearch({ from: '/' })
  const { isPending: isPendingAirQuality, data: airQualityData } = useQuery(
    getListAirQualityQueryOptions({ airQualityType: AirQualityTypes.AIR_QUALITY_NOW }),
  );
  const { isPending: isPendingLandLease, data: landLeaseData } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.EXCAVATION_NOTICE_AREA }),
  );
  const selectedLandLease = landLeaseData?.features.find((feature) => {
    const properties = feature.properties as LandLeaseProps;
    return String(feature.id ?? properties.hakemustunnus ?? 0) === selectedSegment;
  });

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
        data={(landLeaseData?.features ?? []).map((feature) => {
          const properties = feature.properties as LandLeaseProps;
          return { value: String(feature.id ?? properties.hakemustunnus ?? 0), label: properties.osoite ?? "Unknown" };
        })}
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
        disabled={isPendingAirQuality}
        value={selectedAirQualityStation ?? null}
        size="xs"
        variant="filled"
        onChange={(value) => navigate({ search: (prev) => ({ ...prev, selectedAirQualityStation: value ?? undefined }), replace: true })}
        data={(airQualityData?.features ?? []).map((feature) => {
          const properties = (feature.properties ?? {});
          const id = getAirQualityStationId(feature);
          return { value: id, label: properties.Mittausasema ?? "" };
        })}
      />
      <Group gap="xs">
        <Text fw={500} size="sm">Kaupunginosa:</Text>
        <Text size="sm">{selectedLandLease?.properties?.kaupunginosa ?? "Unknown"}</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Hakemus:</Text>
        <Text size="sm">{selectedLandLease?.properties?.hakemustunnus ?? "Unknown"}</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Ajankohta:</Text>
        <Text size="sm">{selectedLandLease?.properties?.tyo_alkaa_txt ?? "Unknown"} - {selectedLandLease?.properties?.tyo_paattyy_txt ?? "Unknown"}</Text>
      </Group>
      <Group gap="xs">
        <Text fw={500} size="sm">Tila:</Text>
        <Text size="sm">{selectedLandLease?.properties?.status ?? "Unknown"}</Text>
      </Group>
      <Button
        size="xs"
        variant="white"
        onClick={() => {}}
        color="black"
        leftSection={<RefreshCcw size={12} />}
        disabled={isPendingLandLease}
      >
        Päivitä
      </Button>
    </Stack>
  );
}

