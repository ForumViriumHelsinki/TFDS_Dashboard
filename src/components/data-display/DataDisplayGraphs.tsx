import { Stack, Text } from "@mantine/core";
import { TrafficFlowChart } from "./TrafficFlowChart";
import { AirQualityChart } from "./AirQualityChart";

export function DataDisplayGraphs() {
  return (
    <Stack flex={1} p="md" h="100%" gap="xs">
      <Stack gap="xs" flex={1}>
        <Text size="xs" c="dimmed">
          Otsikko: Liikennetiedon kattavuus (1-10)
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
