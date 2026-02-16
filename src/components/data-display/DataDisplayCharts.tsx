import { Stack, Text } from "@mantine/core";
import { useSearch } from "@tanstack/react-router";
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
  const trafficTitle = isSegmentsTab
    ? segmentMeasurementField === "typicalSpeed"
      ? "Otsikko: Tyypillinen nopeus (0-120)"
      : segmentMeasurementField === "currentSpeed"
        ? "Otsikko: Nykyinen nopeus (0-120)"
        : segmentMeasurementField === "confidence_level"
          ? "Otsikko: Luotettavuus (0-100)"
          : segmentMeasurementField === "fcd_coverage"
            ? "Otsikko: FCD-kattavuus (0-10)"
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
