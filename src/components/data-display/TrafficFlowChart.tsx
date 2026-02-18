import { Box, Loader, Text, useMantineTheme } from "@mantine/core";
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
import { getSegmentMeasurementFieldConfig } from "../../constants/segment-fields";
import {
  getFloatingCarDataTimeSeriesQueryOptions,
  type FloatingCarDataRow,
} from "../../queries/floating-car-data";
import { generateTimeTicks, formatTick } from "../../utils/chartUtils";
import { FIVE_MINUTES_MS, floorToFiveMinutes } from "../../utils/time";

type TrafficPoint = {
  timestamp: number;
  value: number;
  status?: string;
};

type FieldConfig = {
  label: string;
  yMax: number;
  tickFormatter?: (value: number) => string;
  ticks: number[];
};

function TrafficFlowTooltipContent({
  point,
  label,
  showStatus,
}: {
  point: TrafficPoint;
  label: string;
  showStatus: boolean;
}) {
  const statusLabel =
    point.status === "closed"
      ? "Suljettu"
      : point.status === "open"
        ? "Auki"
        : point.status || "Tuntematon";

  return (
    <>
      <Text size="xs">
        {label}: <strong>{point.value}</strong>
      </Text>
      {showStatus && (
        <Text size="xs">
          Tila: <strong>{statusLabel}</strong>
        </Text>
      )}
    </>
  );
}

interface MessageProps {
  selectedSegment: string | undefined;
  trafficSeries: TrafficPoint[];
  isPending: boolean;
  isError: boolean;
  error: Error | undefined;
}

function Message({
  selectedSegment,
  trafficSeries,
  isPending,
  isError,
  error,
}: MessageProps) {
  const message = useMemo(() => {
    if (isError) return `Tietojen haku epäonnistui: ${error?.message}.`;
    if (trafficSeries.length === 0) return "Ei näytettäviä tietoja valitulla aikavälillä.";
    return null;
  }, [trafficSeries.length, isError, error]);

  if (!selectedSegment) {
    return (
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
          Ei valittua segmenttiä.
        </Text>
      </Box>
    );
  }

  if (isPending) {
    return (
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
        <Text size="sm" c={isError ? "red" : "dimmed"}>
          Haetaan tietoja…
        </Text>
        <Loader size="sm" ml="md"/>
      </Box>
    );
  }

  if (!message) return null;

  return (
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
      <Text size="sm" c={isError ? "red" : "dimmed"}>
        {message}
      </Text>
    </Box>
  );
}

export function TrafficFlowChart() {
  const theme = useMantineTheme();
  const navigate = useNavigate({ from: "/" });
  const {
    selectedSegment,
    selectedStartDate,
    selectedEndDate,
    selectedDate,
    activeTab,
    segmentMeasurementField,
  } = useSearch({
      from: "/",
      select: (s) => ({
        selectedSegment: s.selectedSegment,
        selectedStartDate: s.selectedStartDate,
        selectedEndDate: s.selectedEndDate,
        selectedDate: s.selectedDate,
        activeTab: s.activeTab,
        segmentMeasurementField: s.segmentMeasurementField,
      }),
    });
  const isSegmentsTab = activeTab === "Segmentit";
  const fallbackDateRaw = useFallbackDate(Boolean(!selectedDate), 300_000);
  const fallbackDate = floorToFiveMinutes(fallbackDateRaw);
  const fallbackEndDate = useFallbackDate(Boolean(!selectedEndDate), 60_000);
  const displayDate = selectedDate ?? fallbackDate;
  const effectiveEndDate = selectedEndDate ?? fallbackEndDate;
  const effectiveStartDate = useMemo(() => {
    if (selectedStartDate) return selectedStartDate;
    const baseEnd = effectiveEndDate;
    return new Date(baseEnd.getTime() - 12 * 60 * 60 * 1000);
  }, [effectiveEndDate, selectedStartDate]);

  const trafficFlowQuery = useQuery({
    ...getTrafficFlowQueryOptions({
      start: effectiveStartDate,
      end: effectiveEndDate,
      segmentId: selectedSegment ?? "",
    }),
    enabled: Boolean(selectedSegment && !isSegmentsTab),
  });
  const segmentFieldQuery = useQuery({
    ...getFloatingCarDataTimeSeriesQueryOptions({
      start: effectiveStartDate,
      end: effectiveEndDate,
      segmentId: selectedSegment ?? "",
      field: segmentMeasurementField ?? "",
    }),
    enabled: Boolean(selectedSegment && isSegmentsTab && segmentMeasurementField),
  });
  const selectedDateTs = displayDate.getTime();
  const hasNearValueForSelectedSegment = (() => {
    if (!isSegmentsTab || !selectedSegment) return true;
    if (!Array.isArray(segmentFieldQuery.data)) return false;

    // Match map behavior: value is considered available only within ±5 minutes.
    return (segmentFieldQuery.data as FloatingCarDataRow[]).some((row) => {
      const ts = new Date(
        String((row["_time"] as string | number | boolean | null) ?? ""),
      ).getTime();
      if (!Number.isFinite(ts)) return false;
      return Math.abs(ts - selectedDateTs) <= FIVE_MINUTES_MS;
    });
  })();

  const isPending = isSegmentsTab
    ? segmentFieldQuery.isPending
    : trafficFlowQuery.isPending;
  const isError = isSegmentsTab
    ? segmentFieldQuery.isError
    : trafficFlowQuery.isError;
  const data = useMemo(
    () =>
      isSegmentsTab
        ? hasNearValueForSelectedSegment
          ? segmentFieldQuery.data
          : []
        : trafficFlowQuery.data,
    [
      isSegmentsTab,
      hasNearValueForSelectedSegment,
      segmentFieldQuery.data,
      trafficFlowQuery.data,
    ],
  );
  const error = isSegmentsTab ? segmentFieldQuery.error : trafficFlowQuery.error;

  const fieldConfig = useMemo(() => {
    if (!isSegmentsTab || !segmentMeasurementField) {
      return {
        label: "FCD",
        yMax: 10,
        ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        tickFormatter: (value: number) => {
          if (value === 0) return "Pieni (0)";
          if (value === 10) return "Suuri (10)";
          return String(value);
        },
      } as FieldConfig;
    }
    const config = getSegmentMeasurementFieldConfig(segmentMeasurementField);
    return (
      (config && {
        label: config.label,
        yMax: config.yMax,
        ticks: config.ticks,
      }) ?? {
        label: "FCD",
        yMax: 10,
        ticks: [0, 2, 4, 6, 8, 10],
      }
    );
  }, [isSegmentsTab, segmentMeasurementField]);

  const trafficSeries: TrafficPoint[] = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const rows = isSegmentsTab
      ? (data as FloatingCarDataRow[])
      : (data as TrafficFlowRow[]);

    return rows.map((row) => {
      const isoString = String(
        (row["_time"] as string | number | boolean | null) ?? "",
      );
      const timestamp = new Date(isoString).getTime();
      const valueRaw = isSegmentsTab ? row["_value"] : row["fcd"];
      const numericValue =
        typeof valueRaw === "number"
          ? valueRaw
          : Number.parseFloat(String(valueRaw ?? 0));

      if (isSegmentsTab) {
        return {
          timestamp,
          value: Number.isFinite(numericValue) ? numericValue : 0,
        };
      }

      const statusRaw = row["segment_closure_status"] as
        | string
        | number
        | boolean
        | null;
      return {
        timestamp,
        value: Number.isFinite(numericValue) ? numericValue : 0,
        status: String(statusRaw ?? "").toLowerCase(),
      };
    });
  }, [data, isSegmentsTab]);

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

  const selectedDateTsForReferenceLine =
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
  const closedBands = isSegmentsTab ? [] : buildStatusBands("closed");

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
            y2={fieldConfig.yMax}
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
              y2={fieldConfig.yMax}
              fill={theme.colors.red[0]}
              fillOpacity={1}
              stroke="none"
            />
          ))}
          <YAxis
            ticks={fieldConfig.ticks}
            domain={[0, fieldConfig.yMax]}
            width={40}
            tick={{ fontSize: 10, fill: theme.black }}
            axisLine={{ stroke: theme.colors.gray[3] }}
            tickLine={false}
            tickMargin={6}
            tickFormatter={(value: number) =>
              fieldConfig.tickFormatter
                ? fieldConfig.tickFormatter(value)
                : String(value)
            }
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
          {selectedDateTsForReferenceLine !== undefined &&
            axisMin !== undefined &&
            axisMax !== undefined &&
            selectedDateTsForReferenceLine >= axisMin &&
            selectedDateTsForReferenceLine <= axisMax && (
              <ReferenceLine
                x={selectedDateTsForReferenceLine}
                stroke={theme.colors.brand[0]}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            )}
          <Tooltip
            content={
              <ChartTooltip<TrafficPoint>
                renderContent={(point) =>
                  TrafficFlowTooltipContent({
                    point,
                    label: fieldConfig.label,
                    showStatus: !isSegmentsTab,
                  })
                }
              />
            }
            cursor={{ stroke: theme.colors.gray[5], strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={theme.colors.blue[6]}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <Message selectedSegment={selectedSegment} trafficSeries={trafficSeries} isPending={isPending} isError={isError} error={error ?? undefined} />
    </Box>
  );
}
