import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { Calendar, ExternalLink, RefreshCcw } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { getAirQualityStationId } from "../../utils/airQuality";
import { AirQualityTypes, getListAirQualityQueryOptions } from "../../queries/air-quality";
import { useQuery } from "@tanstack/react-query";
import { getListLandLeaseQueryOptions, LandLeaseProps, landLeaseTypes } from "../../queries/land-leases";
import { buildDisturbanceMapFromJson, getTrafficSegmentsFC } from "../../utils/invertTrafficDisturbances";
import { useMemo } from "react";

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
  const trafficSegmentsFC = getTrafficSegmentsFC();
  const inverted = useMemo(() => buildDisturbanceMapFromJson(), []);
  const matchedApplicationId = useMemo(() => {
    if (!selectedSegment) return undefined;
    const group = Object.values(inverted).find(g => Boolean(g.segments[selectedSegment]));
    return group?.id;
  }, [inverted, selectedSegment]);
  const selectedLandLease = useMemo(() => {
    if (!landLeaseData || !matchedApplicationId) return undefined;
    return landLeaseData.features.find((feature) => {
      const leaseProps = feature.properties as LandLeaseProps | undefined;
      const id = leaseProps?.id ?? "";
      return id === matchedApplicationId;
    });
  }, [landLeaseData, matchedApplicationId]);
    
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
        size="sm"
        variant="filled"
        onChange={(value) => navigate({ search: (prev) => ({ ...prev, selectedSegment: value }), replace: true })}
        data={(trafficSegmentsFC.features ?? []).map((feature) => {
          return { value: feature.properties?.segmentId ?? "", label: feature.properties?.segmentId ?? "" };
        })}
      />
      <DateTimePicker
        label="Mittausaikaväli"
        placeholder="Valitse aikaväli"
        leftSection={<Calendar size={12} />}
        value={new Date("2025-07-28")}
        size="sm"
        variant="filled"
        clearable
      />
      <Select
        label="Ilmanlaadun mittauspiste"
        placeholder="Valitse mittauspiste"
        disabled={isPendingAirQuality}
        value={selectedAirQualityStation ?? null}
        size="sm"
        variant="filled"
        onChange={(value) => navigate({ search: (prev) => ({ ...prev, selectedAirQualityStation: value ?? undefined }), replace: true })}
        data={(airQualityData?.features ?? []).map((feature) => {
          const properties = (feature.properties ?? {});
          const id = getAirQualityStationId(feature);
          return { value: id, label: properties.Mittausasema ?? "" };
        })}
      />
      <Group gap={4}>
        <Text fw={600} size="sm">Kaupunginosa:</Text>
        <Text size="sm">{selectedLandLease?.properties?.kaupunginosa ?? "Unknown"}</Text>
      </Group>
      <Group gap={4}>
        <Text fw={600} size="sm">Hakemus:</Text>
        <Text size="sm">{selectedLandLease?.properties?.hakemustunnus ?? "Unknown"}</Text>
      </Group>
      <Group gap={4}>
        <Text fw={600} size="sm">Ajankohta:</Text>
        <Text size="sm">{selectedLandLease?.properties?.tyo_alkaa_txt ?? "Unknown"} - {selectedLandLease?.properties?.tyo_paattyy_txt ?? "Unknown"}</Text>
      </Group>
      <Group gap={4}>
        <Text fw={600} size="sm">Tila:</Text>
        <Text size="sm">{selectedLandLease?.properties?.status ?? "Unknown"}</Text>
      </Group>
      <Button variant="outline" color="black" size="sm" rightSection={<ExternalLink size={12} />}>
        Alkuperäisdata
      </Button>
      <Button
        size="sm"
        onClick={() => {}}
        color="black"
        leftSection={<RefreshCcw size={12} />}
        disabled={isPendingLandLease}
        bg="black"
        c="white"
      >
        Päivitä
      </Button>
    </Stack>
  );
}

