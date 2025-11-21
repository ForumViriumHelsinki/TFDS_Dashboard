import { Group, Stack, Text } from "@mantine/core";
import {
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceArea,
} from "recharts";
import { CircleHelp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTrafficFlowQueryOptions } from "../../queries/traffic-flow";
import { useSearch } from "@tanstack/react-router";
import type { TrafficFlowRow } from "../../queries/traffic-flow";

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

const aqiData: TimePoint[] = timeLabels.map((t, i) => ({
  time: t,
  value: Math.max(0, Math.min(150, 60 + Math.cos(i / 2) * 20)), // 0..150 domain
}));

const AXIS_TICK_STYLE = { fontSize: 10, fill: "#000000" as const };
const TITLE_STYLE_COLOR = "#495057";
const BG_COLOR = "#F8F9FA";
const BORDER_COLOR = "#ADB5BD";
// const ALERT_BG = "#FFE3E3";



export function DataDisplayGraphs() {
  const { selectedSegment, selectedStartDate, selectedEndDate } = useSearch({ from: '/' })
  
  const query = useQuery(
    getTrafficFlowQueryOptions({
      start: selectedStartDate ?? new Date(),
      end: selectedEndDate ?? new Date(),
      segmentId: selectedSegment ?? "",
    })
  );
  console.log(query.data);

  // Map API rows to chart data: x = HH:mm from _time (5-min points), y = fcd (0..10)
  const trafficSeries = Array.isArray(query.data)
    ? (query.data as TrafficFlowRow[]).map((row) => {
        const iso = String((row["_time"] as string | number | boolean | null) ?? "");
        const date = new Date(iso);
        const ts = date.getTime();
        const fcdValueRaw = row["fcd"] as number | string | boolean | null;
        const fcdValue =
          typeof fcdValueRaw === "number"
            ? fcdValueRaw
            : Number.parseFloat(String(fcdValueRaw ?? 0));
        return { ts, fcd: Number.isFinite(fcdValue) ? fcdValue : 0 };
      })
    : [];
  
  // Compute ticks for time-based axis to avoid overcrowding
  const seriesMin = trafficSeries.length ? Math.min(...trafficSeries.map((d) => d.ts)) : undefined;
  const seriesMax = trafficSeries.length ? Math.max(...trafficSeries.map((d) => d.ts)) : undefined;
  const rangeMs = seriesMin !== undefined && seriesMax !== undefined ? seriesMax - seriesMin : 0;

  function chooseStepMs(totalRangeMs: number): number {
    // Allowed "nice" steps
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const candidates = [
      5 * minute,
      15 * minute,
      30 * minute,
      1 * hour,
      2 * hour,
      3 * hour,
      6 * hour,
      12 * hour,
      1 * day,
      2 * day,
    ];
    const maxLabels = 8; // target max number of labels
    for (const step of candidates) {
      if (totalRangeMs / step <= maxLabels) return step;
    }
    return 7 * day; // fall back to weekly
  }

  function alignToStepCeil(ts: number, stepMs: number): number {
    return Math.ceil(ts / stepMs) * stepMs;
  }

  function generateTimeTicks(minTs?: number, maxTs?: number): number[] {
    if (minTs === undefined || maxTs === undefined || minTs >= maxTs) return [];
    const step = chooseStepMs(maxTs - minTs);
    let t = alignToStepCeil(minTs, step);
    const ticks: number[] = [];
    while (t <= maxTs) {
      ticks.push(t);
      t += step;
    }
    return ticks;
  }

  function formatTick(ts: number): string {
    const d = new Date(ts);
    // Format based on total range
    if (rangeMs <= 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    if (rangeMs <= 3 * 24 * 60 * 60 * 1000) {
      return d.toLocaleString(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
      });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  }

  const xTicks = generateTimeTicks(seriesMin, seriesMax);

  return (
    <Stack flex={1} p="md" h="100%" gap="xs">
      <Stack gap={4} flex={1}>
        <Text size="xs" c={TITLE_STYLE_COLOR}>
          Liikenteen sujuvuus m/h
        </Text>
        <ResponsiveContainer>
          <LineChart data={trafficSeries} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="transparent" />
            {/* Left axis 0..10 with integer ticks */}
            <YAxis
              ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              domain={[0, 10]}
              width={30}
              tick={AXIS_TICK_STYLE}
              axisLine={{ stroke: BORDER_COLOR }}
              tickLine={false}
              tickMargin={6}
            />
            <XAxis
              dataKey="ts"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={xTicks}
              tick={AXIS_TICK_STYLE}
              minTickGap={12}
              tickFormatter={(value: number) => formatTick(value)}
              axisLine={{ stroke: BORDER_COLOR }}
              tickLine={false}
              tickMargin={6}
            />
            <Line type="monotone" dataKey="fcd" stroke="#1971C2" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Stack>

      <Stack gap={4} flex={1}>
        <Group gap={8} align="center">
          <Text size="xs" c={TITLE_STYLE_COLOR}>
            Ilmanlaatu
          </Text>
          <CircleHelp size={16} color="#000000" opacity={0.8} />
        </Group>
        <ResponsiveContainer>
          <LineChart data={aqiData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="transparent" />
            {/* Plot-area background only */}
            <ReferenceArea
              x1="00:00"
              x2="12:00"
              y1={0}
              y2={150}
              fill={BG_COLOR}
              fillOpacity={1}
              stroke="none"
            />
            <YAxis
              domain={[0, 150]}
              ticks={[150, 100, 75, 50, 0]}
              width={30}
              tick={AXIS_TICK_STYLE}
              tickFormatter={(v: number) => (v === 0 ? "AQI" : `${v}`)}
              axisLine={{ stroke: BORDER_COLOR }}
              tickLine={false}
              tickMargin={6}
            />
            <XAxis
              dataKey="time"
              ticks={timeLabels}
              tick={AXIS_TICK_STYLE}
              axisLine={{ stroke: BORDER_COLOR }}
              tickLine={false}
              tickMargin={6}
            />
          </LineChart>
        </ResponsiveContainer>
      </Stack>
    </Stack>
  );
}