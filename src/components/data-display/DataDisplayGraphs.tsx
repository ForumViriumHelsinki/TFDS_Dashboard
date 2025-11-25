import { Stack, Text } from "@mantine/core";
import { TrafficFlowChart } from "./TrafficFlowChart";
import { AirQualityChart } from "./AirQualityChart";

export function DataDisplayGraphs() {
  return (
    <Stack flex={1} p="md" h="100%" gap="xs">
      <Stack gap={4} flex={1}>
        <Text size="xs" c="dimmed">
          Liikenteen sujuvuus
        </Text>
        <TrafficFlowChart />
      </Stack>
      <Stack gap={4} flex={1}>
          <Text size="xs" c="dimmed">
            Ilmanlaatuindeksi
          </Text>
        <AirQualityChart />
      </Stack>
    </Stack>
  );
}