import { Box, Group, Loader, Text, useMantineTheme } from "@mantine/core";
import { useMemo } from "react";
import { useFallbackDate } from "../../hooks/useFallbackDate";
import { ChartTooltip } from "./ChartTooltip";
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
import { generateTimeTicks, formatTick } from "../../utils/chartUtils";

type TrafficPoint = {
  timestamp: number;
  floatingCarData: number;
  status: string;
};

function TrafficFlowTooltipContent(point: TrafficPoint) {
  const statusLabel =
    point.status === "closed"
      ? "Closed"
      : point.status === "open"
        ? "Open"
        : point.status || "Unknown";

  return (
    <>
      <Text size="xs">
        FCD: <strong>{point.floatingCarData}</strong>
      </Text>
      <Text size="xs">
        Status: <strong>{statusLabel}</strong>
      </Text>
    </>
  );
}

export function TrafficFlowChart() {
  const theme = useMantineTheme();
  const navigate = useNavigate({ from: "/" });
  const { selectedSegment, selectedStartDate, selectedEndDate, selectedDate } =
    useSearch({ from: "/" });
  const fallbackDate = useFallbackDate(Boolean(!selectedDate), 60_000);
  const fallbackEndDate = useFallbackDate(Boolean(!selectedEndDate), 60_000);
  const displayDate = selectedDate ?? fallbackDate;
  const effectiveEndDate = selectedEndDate ?? fallbackEndDate;
  const effectiveStartDate = useMemo(() => {
    if (selectedStartDate) return selectedStartDate;
    const baseEnd = effectiveEndDate;
    return new Date(baseEnd.getTime() - 12 * 60 * 60 * 1000);
  }, [effectiveEndDate, selectedStartDate]);

  const { isPending, isError, data, error } = useQuery(
    getTrafficFlowQueryOptions({
      start: effectiveStartDate,
      end: effectiveEndDate,
      segmentId: selectedSegment ?? "",
    }),
  );

  const trafficSeries: TrafficPoint[] = Array.isArray(data)
    ? (data as TrafficFlowRow[]).map((row) => {
        const isoString = String(
          (row["_time"] as string | number | boolean | null) ?? "",
        );
        const date = new Date(isoString);
        const timestamp = date.getTime();
        const floatingCarDataValueRaw = row["fcd"] as
          | number
          | string
          | boolean
          | null;
        const floatingCarDataValue =
          typeof floatingCarDataValueRaw === "number"
            ? floatingCarDataValueRaw
            : Number.parseFloat(String(floatingCarDataValueRaw ?? 0));
        const statusRaw = row["segment_closure_status"] as
          | string
          | number
          | boolean
          | null;
        const status = String(statusRaw ?? "").toLowerCase();
        return {
          timestamp,
          floatingCarData: Number.isFinite(floatingCarDataValue)
            ? floatingCarDataValue
            : 0,
          status,
        };
      })
    : [];

  const seriesMin = trafficSeries.length
    ? Math.min(...trafficSeries.map((point) => point.timestamp))
    : undefined;
  const seriesMax = trafficSeries.length
    ? Math.max(...trafficSeries.map((point) => point.timestamp))
    : undefined;

  const requestedStartTs = selectedStartDate
    ? new Date(selectedStartDate).getTime()
    : undefined;
  const requestedEndTs = selectedEndDate
    ? new Date(selectedEndDate).getTime()
    : undefined;
  // Prefer requested range when available so charts line up on the same ticks
  const axisMin = requestedStartTs ?? seriesMin;
  const axisMax = requestedEndTs ?? seriesMax;
  const rangeMs =
    axisMin !== undefined && axisMax !== undefined ? axisMax - axisMin : 0;

  const selectedDateTs =
    displayDate && axisMin !== undefined && axisMax !== undefined
      ? new Date(displayDate).getTime()
      : undefined;

  const inferredStepMs =
    trafficSeries.length >= 2
      ? Math.max(1, trafficSeries[1].timestamp - trafficSeries[0].timestamp)
      : 5 * 60 * 1000;

  type Band = { x1: number; x2: number };
  function buildStatusBands(targetStatus: "open" | "closed"): Band[] {
    if (
      !trafficSeries.length ||
      seriesMin === undefined ||
      seriesMax === undefined
    )
      return [];
    const bands: Band[] = [];
    let currentStart: number | null = null;
    for (let i = 0; i < trafficSeries.length; i++) {
      const point = trafficSeries[i];
      const statusNorm = String(point.status ?? "").toLowerCase();
      const isTarget = statusNorm === targetStatus;
      const next = trafficSeries[i + 1];
      const nextStatusNorm = next
        ? String(next.status ?? "").toLowerCase()
        : "";
      const nextIsTarget = next ? nextStatusNorm === targetStatus : false;

      if (isTarget && currentStart === null) {
        currentStart = point.timestamp;
      }
      if (isTarget && !nextIsTarget) {
        const rawX1 = currentStart ?? point.timestamp;
        const rawX2 = next ? next.timestamp : point.timestamp + inferredStepMs;
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

  const xTicks = generateTimeTicks(axisMin, axisMax);

  return (
    <Box pos="relative" h="100%" w="100%">
      <ResponsiveContainer>
        <LineChart
          data={trafficSeries}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          onClick={(state) => {
            if (
              state &&
              state.activePayload &&
              state.activePayload.length > 0
            ) {
              const point = state.activePayload[0].payload as TrafficPoint;
              navigate({
                search: (prev) => ({
                  ...prev,
                  selectedDate: new Date(point.timestamp),
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
            fill={theme.colors.gray[1]}
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
              fill={theme.colors.red[0]}
              fillOpacity={1}
              stroke="none"
            />
          ))}
          <YAxis
            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            domain={[0, 10]}
            width={40}
            tick={{ fontSize: 10, fill: theme.black }}
            axisLine={{ stroke: theme.colors.gray[3] }}
            tickLine={false}
            tickMargin={6}
            tickFormatter={(value: number) => {
              if (value === 0) return "Pieni (0)";
              if (value === 10) return "Suuri (10)";
              return String(value);
            }}
          />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={[
              axisMin !== undefined ? (axisMin as number) : "dataMin",
              axisMax !== undefined ? (axisMax as number) : "dataMax",
            ]}
            ticks={xTicks}
            tick={{ fontSize: 10, fill: theme.black }}
            minTickGap={12}
            tickFormatter={(value: number) => formatTick(value, rangeMs)}
            axisLine={{ stroke: theme.colors.gray[3] }}
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
                stroke={theme.colors.brand[0]}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            )}
          <Tooltip
            content={<ChartTooltip renderContent={TrafficFlowTooltipContent} />}
            cursor={{ stroke: theme.colors.gray[5], strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="floatingCarData"
            stroke={theme.colors.blue[6]}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {trafficSeries.length === 0 && !isPending && !isError && (
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
          <Text size="sm" c="dimmed">
            Ei näytettäviä tietoja.
          </Text>
        </Box>
      )}
      {isError && (
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
          <Text size="sm" c="red">
            Tietojen haku epäonnistui: {error?.message}.
          </Text>
        </Box>
      )}
      {isPending && (
        <Group
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <Text size="sm" c="dimmed">
            Haetaan tietoja…
          </Text>
          <Loader size="sm" />
        </Group>
      )}
    </Box>
  );
}
