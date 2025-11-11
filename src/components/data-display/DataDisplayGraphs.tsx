import { Box, Group, Stack, Text } from "@mantine/core";
import { useSearch } from "@tanstack/react-router";
import {
  CartesianGrid,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceArea,
} from "recharts";
import { CircleHelp } from "lucide-react";

type TimePoint = { time: string; value: number };

const timeLabels: string[] = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
];

// Placeholder series to render axes; values are arbitrary and will be replaced later
const trafficData: TimePoint[] = timeLabels.map((t, i) => ({
  time: t,
  value: Math.max(0, Math.min(8, 3 + Math.sin(i / 2) * 2)), // 0..8 domain
}));

const aqiData: TimePoint[] = timeLabels.map((t, i) => ({
  time: t,
  value: Math.max(0, Math.min(150, 60 + Math.cos(i / 2) * 20)), // 0..150 domain
}));

const AXIS_TICK_STYLE = { fontSize: 10, fill: "#000000" as const };
const TITLE_STYLE_COLOR = "#495057";
const BG_COLOR = "#F8F9FA";
const BORDER_COLOR = "#ADB5BD";
const ALERT_BG = "#FFE3E3";

export function DataDisplayGraphs() {
  const { selectedSegment } = useSearch({ from: "/" });

  return (
    <Stack flex={1} p="md" h="100%" gap="xs">
      <Stack gap={4}>
        <Text size="xs" c={TITLE_STYLE_COLOR}>
          Liikenteen sujuvuus m/h
        </Text>
        <Box
          bg={BG_COLOR}
          style={{
            borderLeft: `1px solid ${BORDER_COLOR}`,
            borderBottom: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <Box h={230} w="100%">
            <ResponsiveContainer>
              <LineChart data={trafficData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="transparent" />
                {/* Left axis 0..8 with integer ticks */}
                <YAxis
                  ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
                  domain={[0, 8]}
                  width={30}
                  tick={AXIS_TICK_STYLE}
                  axisLine={false}
                  tickLine={false}
                />
                <XAxis
                  dataKey="time"
                  ticks={timeLabels}
                  tick={AXIS_TICK_STYLE}
                  axisLine={false}
                  tickLine={false}
                />
                {/* Highlight windows (06:00–07:00 and 10:00–12:00) */}
                <ReferenceArea x1="06:00" x2="07:00" fill={ALERT_BG} fillOpacity={1} stroke="none" />
                <ReferenceArea x1="10:00" x2="12:00" fill={ALERT_BG} fillOpacity={1} stroke="none" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Stack>

      <Stack gap={4} flex={1}>
        <Group gap={8} align="center">
          <Text size="xs" c={TITLE_STYLE_COLOR}>
            Ilmanlaatu
          </Text>
          <CircleHelp size={16} color="#000000" opacity={0.8} />
        </Group>
        <Box
          bg={BG_COLOR}
          style={{
            borderLeft: `1px solid ${BORDER_COLOR}`,
            borderBottom: `1px solid ${BORDER_COLOR}`,
          }}
        >
          <Box h={200} w="100%">
            <ResponsiveContainer>
              <LineChart data={aqiData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="transparent" />
                <YAxis
                  domain={[0, 150]}
                  ticks={[150, 100, 75, 50, 0]}
                  width={30}
                  tick={AXIS_TICK_STYLE}
                  tickFormatter={(v: number) => (v === 0 ? "AQI" : `${v}`)}
                  axisLine={false}
                  tickLine={false}
                />
                <XAxis
                  dataKey="time"
                  ticks={timeLabels}
                  tick={AXIS_TICK_STYLE}
                  axisLine={false}
                  tickLine={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Stack>

      {selectedSegment && (
        <Text size="sm" c="dimmed">
          Showing data for: {selectedSegment}
        </Text>
      )}
    </Stack>
  );
}