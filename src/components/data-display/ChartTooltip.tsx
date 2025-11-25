import { Paper, Text } from "@mantine/core";
import { ReactNode } from "react";

interface ChartPoint {
  timestamp: number;
}

interface ChartTooltipProps<T extends ChartPoint> {
  active?: boolean;
  payload?: Array<{ value: number; payload: T }>;
  label?: number;
  renderContent: (point: T) => ReactNode;
}

export function ChartTooltip<T extends ChartPoint>({ active, payload, renderContent }: ChartTooltipProps<T>) {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;
  const date = new Date(point.timestamp);
  const timeLabel = date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Paper withBorder p="xs">
      <Text size="xs">{timeLabel}</Text>
      {renderContent(point)}
    </Paper>
  );
}
