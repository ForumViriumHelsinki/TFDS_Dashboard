import { Group, Stack, Text } from "@mantine/core";
import { CircleHelp } from "lucide-react";
import { TrafficFlowChart } from "./TrafficFlowChart";
import { AirQualityChart } from "./AirQualityChart";
import { useSearch } from "@tanstack/react-router";
import { Sources } from "../../router";

export function DataDisplayGraphs() {
  const { sources } = useSearch({ from: '/' });
  const showAirQuality = sources?.includes(Sources.AIR_QUALITY);
  return (
    <Stack flex={1} p="md" h="100%" gap="xs">
      <Stack gap={4} flex={1}>
        <Text size="xs" c="dimmed">
          Liikenteen sujuvuus m/h
        </Text>
        <TrafficFlowChart />
      </Stack>

      {showAirQuality && (
        <Stack gap={4} flex={1}>
          <Group gap={8} align="center">
            <Text size="xs" c="dimmed">
              Ilmanlaatu
            </Text>
            <CircleHelp size={16} color="#000000" opacity={0.8} />
          </Group>
          <AirQualityChart />
        </Stack>
      )}
    </Stack>
  );
}