import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { Calendar, ExternalLink } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { getAirQualityStationId } from "../../utils/airQuality";
import { AirQualityTypes, getListAirQualityQueryOptions } from "../../queries/air-quality";
import { useQuery } from "@tanstack/react-query";
import { buildSegmentsFeatureCollection } from "../../utils/invertTrafficDisturbances";
import { useEffect, useMemo } from "react";
import { useMergedDisturbances } from "../../hooks/useMergedDisturbances";

const DEFAULT_END_DATE = new Date();
const DEFAULT_START_DATE = new Date(DEFAULT_END_DATE.getTime() - 12 * 60 * 60 * 1000);

export function DataDisplaySidebar() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment, selectedAirQualityStation, selectedStartDate, selectedEndDate } = useSearch({ from: '/' })
  const { isPending: isPendingAirQuality, data: airQualityData } = useQuery(
    getListAirQualityQueryOptions({ airQualityType: AirQualityTypes.AIR_QUALITY_NOW }),
  );
  
  const { map, getSelectedGroupBySegment, isLoading } = useMergedDisturbances();

  const trafficSegmentsFC = useMemo(() => {
    return buildSegmentsFeatureCollection(map);
  }, [map]);
  
  const selectedGroup = useMemo(
    () => getSelectedGroupBySegment(selectedSegment),
    [getSelectedGroupBySegment, selectedSegment]
  );

  // If selected segment is not found (e.g. filtered out), clear it
  useEffect(() => {
    if (!isLoading && selectedSegment && !selectedGroup) {
      navigate({ search: (prev) => ({ ...prev, selectedSegment: undefined }), replace: true })
    }
  }, [isLoading, selectedSegment, selectedGroup, navigate]);
 
  // Initialize URL search params with defaults on first load if missing
  useEffect(() => {
    if (!selectedStartDate || !selectedEndDate) {
      navigate({
        search: (prev) => ({
          ...prev,
          selectedStartDate: selectedStartDate ?? DEFAULT_START_DATE,
          selectedEndDate: selectedEndDate ?? DEFAULT_END_DATE,
        }),
        replace: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        clearable
        onClear={() => navigate({ search: (prev) => ({ ...prev, selectedSegment: "" }), replace: true })}
      />
      <DateTimePicker
        label="Mittausaikaväli alkaen"
        placeholder="Valitse alkuhetki"
        leftSection={<Calendar size={12} />}
        value={selectedStartDate ?? null}
        onChange={(value) => {
          void navigate({
            search: (prev) => ({
              ...prev,
              selectedStartDate: value ?? undefined,
            }),
            replace: true,
          });
        }}
        size="sm"
        variant="filled"
        clearable
        maxDate={new Date()}
        popoverProps={{ withinPortal: true, zIndex: 1200 }}
      />
      <DateTimePicker
        label="Mittausaikaväli päättyen"
        placeholder="Valitse loppuhetki"
        leftSection={<Calendar size={12} />}
        value={selectedEndDate ?? null}
        onChange={(value) => {
          void navigate({
            search: (prev) => ({
              ...prev,
              selectedEndDate: value ?? undefined,
            }),
            replace: true,
          });
        }}
        size="sm"
        variant="filled"
        clearable
        maxDate={new Date()}
        popoverProps={{ withinPortal: true, zIndex: 1200 }}
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
        <Text size="sm">{selectedGroup?.landLeaseProperties?.kaupunginosa ?? "Unknown"}</Text>
      </Group>
      <Group gap={4}>
        <Text fw={600} size="sm">Hakemus:</Text>
        <Text size="sm">{selectedGroup?.landLeaseProperties?.hakemustunnus ?? "Unknown"}</Text>
      </Group>
      <Group gap={4}>
        <Text fw={600} size="sm">Ajankohta:</Text>
        <Text size="sm">{selectedGroup?.landLeaseProperties?.tyo_alkaa_txt ?? "Unknown"} - {selectedGroup?.landLeaseProperties?.tyo_paattyy_txt ?? "Unknown"}</Text>
      </Group>
      <Group gap={4}>
        <Text fw={600} size="sm">Tila:</Text>
        <Text size="sm">{selectedGroup?.landLeaseProperties?.status ?? "Unknown"}</Text>
      </Group>
      <Button variant="outline" color="black" size="sm" rightSection={<ExternalLink size={12} />}>
        Alkuperäisdata
      </Button>
    </Stack>
  );
}

