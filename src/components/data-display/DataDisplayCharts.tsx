import { Box, Group, Stack, Text, useMantineTheme } from "@mantine/core";
import { useSearch } from "@tanstack/react-router";
import { getSegmentMeasurementFieldConfig } from "../../constants/segment-fields";
import { TrafficFlowChart } from "./TrafficFlowChart";
import { AirQualityChart } from "./AirQualityChart";
import { useFilteredAirQuality } from "../../hooks/useFilteredAirQuality";
import { getAirQualityStationId } from "../../utils/airQuality";

export function DataDisplayCharts() {
  const theme = useMantineTheme();
  const {
    activeTab,
    segmentMeasurementField,
    selectedAirQualityStation,
    selectedDate,
    selectedDateMode,
  } = useSearch({
    from: "/",
    select: (s) => ({
      activeTab: s.activeTab,
      segmentMeasurementField: s.segmentMeasurementField,
      selectedAirQualityStation: s.selectedAirQualityStation,
      selectedDate: s.selectedDate,
      selectedDateMode: s.selectedDateMode,
    }),
  });
  const { data: airQualityData } = useFilteredAirQuality(
    selectedDate,
    selectedDateMode,
  );
  const selectedAirQualityStationName =
    airQualityData?.features.find(
      (feature) => getAirQualityStationId(feature) === selectedAirQualityStation,
    )?.properties?.Mittausasema ?? selectedAirQualityStation;
  const isSegmentsTab = activeTab === "Segmentit";
  const selectedFieldConfig = getSegmentMeasurementFieldConfig(
    segmentMeasurementField,
  );
  const trafficTitle = isSegmentsTab
    ? selectedFieldConfig
      ? ` ${selectedFieldConfig.label} (0-${selectedFieldConfig.yMax})`
      : "Valitse muuttuja"
    : "Liikennetiedon kattavuus (1-10)";

  return (
    <Stack flex={1} p="md" h="100%" gap="xs">
      <Stack gap="xs" flex={1}>
        <Text size="xs" c="dimmed">
          {trafficTitle}
        </Text>
        <TrafficFlowChart />
      </Stack>
      <Stack gap="xs" flex={1}>
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Ilmanlaatuindeksi - {selectedAirQualityStationName ?? "Valitse mittausasema"}
          </Text>
          <Group gap="md">
            <Group gap={6}>
              <Box
                w={14}
                style={{
                  borderTop: `2px solid ${theme.colors.blue[6]}`,
                }}
              />
              <Text size="xs">Ilmanlaatuindeksi</Text>
            </Group>
            <Group gap={6}>
              <Box
                w={14}
                style={{
                  borderTop: `2px solid ${theme.colors.violet[6]}`,
                }}
              />
              <Text size="xs">TFDS-AQI</Text>
            </Group>
          </Group>
        </Group>
        <AirQualityChart />
      </Stack>
    </Stack>
  );
}
