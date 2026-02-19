import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  YAxis,
  XAxis,
  Line,
  Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import {
  AirQualityTypes,
  getListAirQualityQueryOptions,
} from "../../queries/air-quality";
import {
  getAqiTimeSeriesByStationQueryOptions,
  type AqiTimeSeriesRow,
} from "../../queries/aqi";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { FeatureCollection, Geometry } from "geojson";
import {
  parseFinnishAikaToDate,
  type AirQualityProps,
} from "../../utils/airQuality";
import { generateTimeTicks, formatTick } from "../../utils/chartUtils";
import { Box, Text, useMantineTheme } from "@mantine/core";
import { useMemo } from "react";
import { ChartTooltip } from "./ChartTooltip";
import { LoadingState } from "../shared/LoadingState";
import { getDefaultDateRange } from "../../utils/time";

type TimePoint = {
  timestamp: number;
  index: number;
  tfdsAqi?: number;
  indexTooltip?: number;
};
type TfdsPoint = { timestamp: number; tfdsAqi: number };

function AirQualityTooltipContent(point: TimePoint) {
  return (
    <>
      <Text size="xs">
        Ilmanlaatuindeksi:{" "}
        <strong>
          {Number.isFinite(point.indexTooltip as number)
            ? point.indexTooltip
            : "-"}
        </strong>
      </Text>
      <Text size="xs">
        TFDS-AQI:{" "}
        <strong>
          {Number.isFinite(point.tfdsAqi as number)
            ? (point.tfdsAqi as number).toFixed(2)
            : "-"}
        </strong>
      </Text>
    </>
  );
}

interface MessageProps {
  selectedAirQualityStation: string | undefined;
  filteredSeries: TimePoint[];
  isPending: boolean;
  isError: boolean;
  error: Error | undefined;
}

function Message({
  selectedAirQualityStation,
  filteredSeries,
  isPending,
  isError,
  error,
}: MessageProps) {
  const message = useMemo(() => {
    if (filteredSeries.length === 0) return "Ei näytettäviä tietoja valitulla aikavälillä.";
    if (isError) return `Tietojen haku epäonnistui: ${error?.message}.`;
    return null;
  }, [filteredSeries.length, isError, error]);

  if (!selectedAirQualityStation) {
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
          Ei valittua ilmanlaadun mittausasemaa.
        </Text>
      </Box>
    );
  }

  if (isPending) {
    return <LoadingState message="Haetaan ilmanlaatutietoja…" variant="overlay" />;
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

export function AirQualityChart() {
  const theme = useMantineTheme();
  const navigate = useNavigate({ from: "/" });
  const {
    selectedAirQualityStation,
    selectedStartDate,
    selectedEndDate,
    selectedDate,
  } = useSearch({
    from: "/",
    select: (s) => ({
      selectedAirQualityStation: s.selectedAirQualityStation,
      selectedStartDate: s.selectedStartDate,
      selectedEndDate: s.selectedEndDate,
      selectedDate: s.selectedDate,
    }),
  });
  const { isPending, isError, data, error } = useQuery({
    ...getListAirQualityQueryOptions({
      airQualityType: AirQualityTypes.AIR_QUALITY_24H_MAX,
    }),
    enabled: Boolean(selectedAirQualityStation),
  });
  const { data: nowData } = useQuery({
    ...getListAirQualityQueryOptions({
      airQualityType: AirQualityTypes.AIR_QUALITY_NOW,
    }),
    enabled: Boolean(selectedAirQualityStation),
  });
  const fallbackRange = useMemo(() => getDefaultDateRange(), []);
  const effectiveEndDate = selectedEndDate ?? fallbackRange.end;
  const effectiveStartDate = useMemo(() => {
    if (selectedStartDate) return selectedStartDate;
    const baseEnd = effectiveEndDate;
    return new Date(baseEnd.getTime() - 12 * 60 * 60 * 1000);
  }, [effectiveEndDate, selectedStartDate]);
  const displayDate = selectedDate ?? effectiveEndDate;

  const requestedStartTs = effectiveStartDate.getTime();
  const requestedEndTs = effectiveEndDate.getTime();

  const features = useMemo(
    () =>
      (data as FeatureCollection<Geometry, AirQualityProps> | undefined)
        ?.features ?? [],
    [data],
  );
  const stationName = useMemo(() => {
    if (!selectedAirQualityStation) return undefined;

    const findNameById = (
      sourceFeatures: Array<{ properties?: AirQualityProps }> | undefined,
    ) => {
      for (const feature of sourceFeatures ?? []) {
        const properties = feature.properties ?? {};
        const stationId = String(properties.Mittausaseman_numero ?? "");
        if (stationId !== String(selectedAirQualityStation)) continue;
        const name = String(properties.Mittausasema ?? "").trim();
        if (name) return name;
      }
      return undefined;
    };

    // Prefer "now" dataset for station metadata reliability.
    const fromNow = findNameById(
      (nowData as FeatureCollection<Geometry, AirQualityProps> | undefined)
        ?.features,
    );
    if (fromNow) return fromNow;

    return findNameById(features);
  }, [features, nowData, selectedAirQualityStation]);
  const { data: tfdsAqiData } = useQuery({
    ...getAqiTimeSeriesByStationQueryOptions({
      start: effectiveStartDate,
      end: effectiveEndDate,
      stationName: stationName ?? "",
    }),
    enabled: Boolean(stationName),
  });

  const filteredSeries: TimePoint[] = features
    .filter((feature) => {
      const airQualityProperties = feature.properties ?? {};
      const stationId = String(airQualityProperties.Mittausaseman_numero ?? "");
      if (!selectedAirQualityStation) return false;
      if (stationId !== String(selectedAirQualityStation)) return false;
      const date = parseFinnishAikaToDate(airQualityProperties.Aika);
      if (!date) return false;
      const timestamp = date.getTime();
      if (requestedStartTs !== undefined && timestamp < requestedStartTs) return false;
      if (requestedEndTs !== undefined && timestamp > requestedEndTs) return false;
      return true;
    })
    .map((feature) => {
      const airQualityProperties = feature.properties ?? {};
      const date = parseFinnishAikaToDate(airQualityProperties.Aika);
      const timestamp = date ? date.getTime() : 0;
      const indexVal = Number(airQualityProperties.Ilmanlaatuindeksi ?? 0);
      return { timestamp, index: Number.isFinite(indexVal) ? indexVal : 0 };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
  const tfdsSeries: TfdsPoint[] = useMemo(() => {
    if (!Array.isArray(tfdsAqiData)) return [];
    return (tfdsAqiData as AqiTimeSeriesRow[])
      .map((row) => {
        const timestamp = new Date(String(row["_time"] ?? "")).getTime();
        const rawValue = row["_value"];
        const numericValue =
          typeof rawValue === "number"
            ? rawValue
            : Number.parseFloat(String(rawValue ?? ""));
        return {
          timestamp,
          tfdsAqi: Number.isFinite(numericValue) ? numericValue : NaN,
        };
      })
      .filter(
        (point) =>
          Number.isFinite(point.timestamp) &&
          Number.isFinite(point.tfdsAqi) &&
          point.timestamp >= requestedStartTs &&
          point.timestamp <= requestedEndTs,
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [requestedEndTs, requestedStartTs, tfdsAqiData]);
  const combinedSeries: TimePoint[] = useMemo(() => {
    const byTimestamp = new Map<number, TimePoint>();

    for (const point of filteredSeries) {
      byTimestamp.set(point.timestamp, {
        timestamp: point.timestamp,
        index: point.index,
        indexTooltip: point.index,
      });
    }

    for (const point of tfdsSeries) {
      const existing = byTimestamp.get(point.timestamp);
      if (existing) {
        existing.tfdsAqi = point.tfdsAqi;
      } else {
        byTimestamp.set(point.timestamp, {
          timestamp: point.timestamp,
          index: NaN,
          tfdsAqi: point.tfdsAqi,
        });
      }
    }
    const sorted = Array.from(byTimestamp.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    let previousIndex: number | undefined;
    for (const point of sorted) {
      if (Number.isFinite(point.index)) {
        previousIndex = point.index;
        point.indexTooltip = point.index;
        continue;
      }
      point.indexTooltip = previousIndex;
    }
    return sorted;
  }, [filteredSeries, tfdsSeries]);

  const axisMin = requestedStartTs;
  const axisMax = requestedEndTs;
  const rangeMs =
    axisMin !== undefined && axisMax !== undefined ? axisMax - axisMin : 0;

  const selectedDateTs =
    displayDate && axisMin !== undefined && axisMax !== undefined
      ? new Date(displayDate).getTime()
      : undefined;

  const xTicks = generateTimeTicks(axisMin, axisMax);

  const yValues = filteredSeries.map((point) => point.index);
  const yMin = yValues.length ? Math.min(...yValues) : 0;
  const yMax = yValues.length ? Math.max(...yValues) : 1;
  const yDomain =
    yValues.length && yMin !== yMax
      ? [yMin, yMax]
      : [Math.max(0, yMin - 1), yMax + 1];
  const tfdsValues = tfdsSeries
    .map((point) => point.tfdsAqi)
    .filter((value): value is number => Number.isFinite(value));
  const hasTfdsSeries = tfdsValues.length > 0;
  const tfdsMin = hasTfdsSeries ? Math.min(...tfdsValues) : 0;
  const tfdsMax = hasTfdsSeries ? Math.max(...tfdsValues) : 1;
  const tfdsDomain =
    hasTfdsSeries && tfdsMin !== tfdsMax
      ? [tfdsMin, tfdsMax]
      : [Math.max(0, tfdsMin - 1), tfdsMax + 1];

    
  return (
    <Box pos="relative" h="100%" w="100%">
      <ResponsiveContainer>
        <LineChart
          data={combinedSeries}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          onClick={(state) => {
            if (
              state &&
              state.activePayload &&
              state.activePayload.length > 0
            ) {
              const point = state.activePayload[0].payload as TimePoint;
              navigate({
                search: (prev) => ({
                  ...prev,
                  selectedDate: new Date(point.timestamp),
                  selectedDateMode: "manual",
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
            y1={yDomain[0]}
            y2={yDomain[1]}
            fill={theme.colors.gray[1]}
            fillOpacity={1}
            stroke="none"
          />
          <YAxis
            yAxisId="left"
            domain={yDomain as [number, number]}
            width={40}
            tick={{ fontSize: 10, fill: theme.black }}
            axisLine={{ stroke: theme.colors.gray[3] }}
            tickLine={false}
            tickMargin={6}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            hide={!hasTfdsSeries}
            domain={tfdsDomain as [number, number]}
            width={40}
            tick={{ fontSize: 10, fill: theme.colors.violet[6] }}
            axisLine={{ stroke: theme.colors.gray[3] }}
            tickLine={false}
            tickMargin={6}
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
                yAxisId="left"
                stroke={theme.colors.brand[0]}
                strokeWidth={1}
                strokeDasharray="4 2"
              />
            )}
          <Tooltip
            content={<ChartTooltip renderContent={AirQualityTooltipContent} />}
            cursor={{ stroke: theme.colors.gray[5], strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="index"
            yAxisId="left"
            stroke={theme.colors.blue[6]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="tfdsAqi"
            yAxisId="right"
            stroke={theme.colors.violet[6]}
            strokeWidth={2}
            dot={false}
            hide={!hasTfdsSeries}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <Message selectedAirQualityStation={selectedAirQualityStation} filteredSeries={filteredSeries} isPending={isPending} isError={isError} error={error ?? undefined} />
    </Box>
  );
}
