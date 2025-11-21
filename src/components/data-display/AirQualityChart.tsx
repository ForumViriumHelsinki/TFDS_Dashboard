import { ResponsiveContainer, LineChart, CartesianGrid, ReferenceArea, YAxis, XAxis } from "recharts";

type TimePoint = { time: string; value: number };

const timeLabels: string[] = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
];

const aqiData: TimePoint[] = timeLabels.map((t, i) => ({
  time: t,
  value: Math.max(0, Math.min(150, 60 + Math.cos(i / 2) * 20)),
}));

const AXIS_TICK_STYLE = { fontSize: 10, fill: "#000000" as const };
const BG_COLOR = "#F8F9FA";
const BORDER_COLOR = "#ADB5BD";

export function AirQualityChart() {
  return (
    <ResponsiveContainer>
      <LineChart data={aqiData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="transparent" />
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
  );
}


