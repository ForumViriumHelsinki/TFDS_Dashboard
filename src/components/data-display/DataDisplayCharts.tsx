import { Stack, Text } from "@mantine/core";
import { useSearch } from "@tanstack/react-router";
import { getSegmentMeasurementFieldConfig } from "../../constants/segment-fields";
import { TrafficFlowChart } from "./TrafficFlowChart";
import { AirQualityChart } from "./AirQualityChart";

export function DataDisplayCharts() {
  const { activeTab, segmentMeasurementField } = useSearch({
    from: "/",
    select: (s) => ({
      activeTab: s.activeTab,
      segmentMeasurementField: s.segmentMeasurementField,
    }),
  });
  const isSegmentsTab = activeTab === "Segmentit";
  const selectedFieldConfig = getSegmentMeasurementFieldConfig(
    segmentMeasurementField,
  );
  const trafficTitle = isSegmentsTab
    ? selectedFieldConfig
      ? `Otsikko: ${selectedFieldConfig.label} (0-${selectedFieldConfig.yMax})`
      : "Otsikko: Valitse muuttuja"
    : "Otsikko: Liikennetiedon kattavuus (1-10)";

  return (
    <Stack flex={1} p="md" h="100%" gap="xs">
      <Stack gap="xs" flex={1}>
        <Text size="xs" c="dimmed">
          {trafficTitle}
        </Text>
        <TrafficFlowChart />
      </Stack>
      <Stack gap="xs" flex={1}>
        <Text size="xs" c="dimmed">
          Ilmanlaatuindeksi
        </Text>
        <AirQualityChart />
      </Stack>
    </Stack>
  );
}
