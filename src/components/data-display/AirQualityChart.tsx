import { ResponsiveContainer, LineChart, CartesianGrid, ReferenceArea, ReferenceLine, YAxis, XAxis, Line, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { AirQualityTypes, getListAirQualityQueryOptions } from "../../queries/air-quality";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { FeatureCollection, Geometry } from "geojson";
import { parseFinnishAikaToDate, type AirQualityProps } from "../../utils/airQuality";

type TimePoint = { ts: number; index: number };

const AXIS_TICK_STYLE = { fontSize: 10, fill: "#000000" as const };
const BORDER_COLOR = "#ADB5BD";
const BG_COLOR = "#F8F9FA";

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

function AirQualityTooltip(props: {
  active?: boolean;
  payload?: Array<{ value: number; payload: TimePoint }>;
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

  return (
    <div
      style={{
        background: "white",
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: 4,
        padding: "4px 8px",
        fontSize: 12,
      }}
    >
      <div>{timeLabel}</div>
      <div>
        Ilmanlaatuindeksi: <strong>{point.index}</strong>
      </div>
    </div>
  );
}

export function AirQualityChart() {
  const navigate = useNavigate({ from: '/' });
  const { selectedAirQualityStation, selectedStartDate, selectedEndDate, selectedDate } = useSearch({ from: '/' });
  const { data } = useQuery({
    ...getListAirQualityQueryOptions({ airQualityType: AirQualityTypes.AIR_QUALITY_24H_MAX }),
  });

  const requestedStartTs = selectedStartDate ? new Date(selectedStartDate).getTime() : undefined;
  const requestedEndTs = selectedEndDate ? new Date(selectedEndDate).getTime() : undefined;

  const features = (data as FeatureCollection<Geometry, AirQualityProps> | undefined)?.features ?? [];

  const filteredSeries: TimePoint[] = features
    .filter((f) => {
      const aqProps = f.properties ?? {};
      const stationId = String(aqProps.Mittausaseman_numero ?? "");
      if (!selectedAirQualityStation) return false;
      if (stationId !== String(selectedAirQualityStation)) return false;
      const d = parseFinnishAikaToDate(aqProps.Aika);
      if (!d) return false;
      const ts = d.getTime();
      if (requestedStartTs !== undefined && ts < requestedStartTs) return false;
      if (requestedEndTs !== undefined && ts > requestedEndTs) return false;
      return true;
    })
    .map((f) => {
      const aqProps = f.properties ?? {};
      const d = parseFinnishAikaToDate(aqProps.Aika);
      const ts = d ? d.getTime() : 0;
      const indexVal = Number(aqProps.Ilmanlaatuindeksi ?? 0);
      return { ts, index: Number.isFinite(indexVal) ? indexVal : 0 };
    })
    .sort((a, b) => a.ts - b.ts);

  const seriesMinTs = filteredSeries.length ? filteredSeries[0].ts : undefined;
  const seriesMaxTs = filteredSeries.length ? filteredSeries[filteredSeries.length - 1].ts : undefined;
  // Prefer requested range when available so charts line up on the same ticks
  const axisMin = requestedStartTs ?? seriesMinTs;
  const axisMax = requestedEndTs ?? seriesMaxTs;
  const rangeMs = axisMin !== undefined && axisMax !== undefined ? axisMax - axisMin : 0;

  const selectedDateTs =
    selectedDate && axisMin !== undefined && axisMax !== undefined
      ? new Date(selectedDate).getTime()
      : undefined;

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

  const yValues = filteredSeries.map((p) => p.index);
  const yMin = yValues.length ? Math.min(...yValues) : 0;
  const yMax = yValues.length ? Math.max(...yValues) : 1;
  const yDomain =
    yValues.length && yMin !== yMax
      ? [yMin, yMax]
      : [Math.max(0, yMin - 1), yMax + 1];

  return (
    <ResponsiveContainer>
      <LineChart
        data={filteredSeries}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        onClick={(state) => {
          if (state && state.activePayload && state.activePayload.length > 0) {
            const point = state.activePayload[0].payload as TimePoint;
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
          y1={yDomain[0]}
          y2={yDomain[1]}
          fill={BG_COLOR}
          fillOpacity={1}
          stroke="none"
        />
        <YAxis
          domain={yDomain as [number, number]}
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
              stroke="#FA5252"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}
        <Tooltip
          content={<AirQualityTooltip />}
          cursor={{ stroke: BORDER_COLOR, strokeDasharray: "3 3" }}
        />
        <Line type="monotone" dataKey="index" stroke="#1971C2" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}


