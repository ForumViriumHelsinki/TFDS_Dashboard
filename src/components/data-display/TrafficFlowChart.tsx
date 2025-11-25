import { Box, Paper, Text } from "@mantine/core";
import {
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getTrafficFlowQueryOptions } from "../../queries/traffic-flow";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { TrafficFlowRow } from "../../queries/traffic-flow";
import { BORDER_COLOR, BRAND_COLOR, BG_COLOR } from "../../main";

const AXIS_TICK_STYLE = { fontSize: 10, fill: "#000000" as const };
const CLOSED_BG = "#FFE3E3";

type TrafficPoint = { ts: number; fcd: number; status: string };

function TrafficFlowTooltip(props: {
  active?: boolean;
  payload?: Array<{ value: number; payload: TrafficPoint }>;
  label?: number;
}) {
  const { active, payload } = props;
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;
  const d = new Date(point.ts);
  const timeLabel = d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusLabel =
    point.status === "closed" ? "Closed" : point.status === "open" ? "Open" : point.status || "Unknown";

  return (
    <Paper
      withBorder
      p="xs"
    >
      <Text size="xs">{timeLabel}</Text>
      <Text size="xs">
        FCD: <strong>{point.fcd}</strong>
      </Text>
      <Text size="xs">Status: <strong>{statusLabel}</strong></Text>
    </Paper>  
  );
}

export function TrafficFlowChart() {
  const navigate = useNavigate({ from: '/' });
  const { selectedSegment, selectedStartDate, selectedEndDate, selectedDate } = useSearch({ from: '/' })
  
  const query = useQuery(
    getTrafficFlowQueryOptions({
      start: selectedStartDate ?? new Date(),
      end: selectedEndDate ?? new Date(),
      segmentId: selectedSegment ?? "",
    })
  );
  // console.log(query.data);

  const trafficSeries: TrafficPoint[] = Array.isArray(query.data)
    ? (query.data as TrafficFlowRow[]).map((row) => {
        const iso = String((row["_time"] as string | number | boolean | null) ?? "");
        const date = new Date(iso);
        const ts = date.getTime();
        const fcdValueRaw = row["fcd"] as number | string | boolean | null;
        const fcdValue =
          typeof fcdValueRaw === "number"
            ? fcdValueRaw
            : Number.parseFloat(String(fcdValueRaw ?? 0));
        const statusRaw = row["segment_closure_status"] as string | number | boolean | null;
        const status = String(statusRaw ?? "").toLowerCase();
        return { ts, fcd: Number.isFinite(fcdValue) ? fcdValue : 0, status };
      })
    : [];

  const seriesMin = trafficSeries.length ? Math.min(...trafficSeries.map((d) => d.ts)) : undefined;
  const seriesMax = trafficSeries.length ? Math.max(...trafficSeries.map((d) => d.ts)) : undefined;

  const requestedStartTs = selectedStartDate ? new Date(selectedStartDate).getTime() : undefined;
  const requestedEndTs = selectedEndDate ? new Date(selectedEndDate).getTime() : undefined;
  // Prefer requested range when available so charts line up on the same ticks
  const axisMin = requestedStartTs ?? seriesMin;
  const axisMax = requestedEndTs ?? seriesMax;
  const rangeMs = axisMin !== undefined && axisMax !== undefined ? axisMax - axisMin : 0;

  const selectedDateTs =
    selectedDate && axisMin !== undefined && axisMax !== undefined
      ? new Date(selectedDate).getTime()
      : undefined;

  const inferredStepMs =
    trafficSeries.length >= 2 ? Math.max(1, trafficSeries[1].ts - trafficSeries[0].ts) : 5 * 60 * 1000;

  type Band = { x1: number; x2: number };
  function buildStatusBands(targetStatus: "open" | "closed"): Band[] {
    if (!trafficSeries.length || seriesMin === undefined || seriesMax === undefined) return [];
    const bands: Band[] = [];
    let currentStart: number | null = null;
    for (let i = 0; i < trafficSeries.length; i++) {
      const point = trafficSeries[i];
      const statusNorm = String(point.status ?? "").toLowerCase();
      const isTarget = statusNorm === targetStatus;
      const next = trafficSeries[i + 1];
      const nextStatusNorm = next ? String(next.status ?? "").toLowerCase() : "";
      const nextIsTarget = next ? nextStatusNorm === targetStatus : false;

      if (isTarget && currentStart === null) {
        currentStart = point.ts;
      }
      if (isTarget && !nextIsTarget) {
        const rawX1 = currentStart ?? point.ts;
        const rawX2 = next ? next.ts : point.ts + inferredStepMs;
        const x1 = Math.max(seriesMin, rawX1);
        const x2 = Math.min(seriesMax, rawX2);
        if (x2 > x1) {
          bands.push({ x1, x2 });
        }
        currentStart = null;
      }
    }
    return bands;
  }
  const closedBands = buildStatusBands("closed");

  function chooseStepMs(totalRangeMs: number): number {
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
    const maxLabels = 8;
    for (const step of candidates) {
      if (totalRangeMs / step <= maxLabels) return step;
    }
    return 7 * day;
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

  const xTicks = generateTimeTicks(axisMin, axisMax);

  return (
    <Box pos="relative" h="100%" w="100%">
      <ResponsiveContainer>
        <LineChart
          data={trafficSeries}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          onClick={(state) => {
            if (state && state.activePayload && state.activePayload.length > 0) {
              const point = state.activePayload[0].payload as TrafficPoint;
              navigate({
              search: (prev) => ({
                ...prev,
                selectedDate: new Date(point.ts),
              }),
                replace: true,
              });
            }
          }}
        >
          <CartesianGrid vertical={false} stroke="transparent" />
          <ReferenceArea
            x1={axisMin !== undefined ? (axisMin as number) : undefined}
            x2={axisMax !== undefined ? (axisMax as number) : undefined}
            y1={0}
            y2={10}
            fill={BG_COLOR}
            fillOpacity={1}
            stroke="none"
          />
          {closedBands.map((b, i) => (
            <ReferenceArea
              key={i}
              x1={b.x1}
              x2={b.x2}
              y1={0}
              y2={10}
              fill={CLOSED_BG}
              fillOpacity={1}
              stroke="none"
            />
          ))}
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
            domain={[
              axisMin !== undefined ? (axisMin as number) : "dataMin",
              axisMax !== undefined ? (axisMax as number) : "dataMax",
            ]}
            ticks={xTicks}
            tick={AXIS_TICK_STYLE}
            minTickGap={12}
            tickFormatter={(value: number) => formatTick(value)}
            axisLine={{ stroke: BORDER_COLOR }}
            tickLine={false}
            tickMargin={6}
          />
          {selectedDateTs !== undefined &&
            axisMin !== undefined &&
            axisMax !== undefined &&
            selectedDateTs >= axisMin &&
            selectedDateTs <= axisMax && (
              <ReferenceLine
                x={selectedDateTs}
                stroke={BRAND_COLOR}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            )}
          <Tooltip
            content={<TrafficFlowTooltip />}
            cursor={{ stroke: BORDER_COLOR, strokeDasharray: "3 3" }}
          />
          <Line type="monotone" dataKey="fcd" stroke="#1971C2" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      {trafficSeries.length === 0 && (
        <Box
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Text size="sm" c="#868e96">No data found</Text>
        </Box>
      )}
    </Box>
  );
}


