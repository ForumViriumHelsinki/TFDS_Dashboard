import { ChartLine } from "lucide-react";
import { useMantineTheme } from "@mantine/core";
import { SelectableNavItem } from "../shared/SelectableNavItem";

interface SegmentItemProps {
  segmentId: string;
  segmentLabel: string;
  isSelected: boolean;
  onClick: () => void;
  measurementText?: string;
}

export function SegmentItem({
  segmentId,
  segmentLabel,
  isSelected,
  onClick,
  measurementText,
}: SegmentItemProps) {
  const theme = useMantineTheme();
  const brandColor = theme.colors.brand[0];
  const description = measurementText
    ? `${segmentId} · ${measurementText}`
    : segmentId;

  return (
    <SelectableNavItem
      label={segmentLabel}
      description={description}
      onClick={onClick}
      leftSection={
        <ChartLine size={16} color={isSelected ? brandColor : theme.black} />
      }
      isSelected={isSelected}
    />
  );
}
