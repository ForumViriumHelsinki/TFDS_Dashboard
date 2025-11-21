import { Group, Stack, Text } from "@mantine/core";
import { CircleHelp } from "lucide-react";
import { TrafficFlowChart } from "./TrafficFlowChart";
import { AirQualityChart } from "./AirQualityChart";

export function DataDisplayGraphs() {
  return (
    <Stack flex={1} p="md" h="100%" gap="xs">
      <Stack gap={4} flex={1}>
        <Text size="xs" c="dimmed">
          Liikenteen sujuvuus m/h
        </Text>
        <TrafficFlowChart />
      </Stack>
      <Stack gap={4} flex={1}>
        <Group gap={8} align="center">
          <Text size="xs" c="dimmed">
            Ilmanlaatu
          </Text>
          <CircleHelp size={16} color="#000000" opacity={0.8} />
        </Group>
        <AirQualityChart />
      </Stack>
    </Stack>
  );
}