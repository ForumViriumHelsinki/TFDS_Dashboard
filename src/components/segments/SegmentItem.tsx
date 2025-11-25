import { ChartLine } from "lucide-react";
import { useMantineTheme } from "@mantine/core";
import { SelectableNavItem } from "../shared/SelectableNavItem";

interface SegmentItemProps {
  segmentId: string;
  segmentLabel: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SegmentItem({
  segmentId,
  segmentLabel,
  isSelected,
  onClick,
}: SegmentItemProps) {
  const theme = useMantineTheme();
  const brandColor = theme.colors.brand[0];

  return (
    <SelectableNavItem
      label={segmentLabel}
      description={segmentId}
      onClick={onClick}
      leftSection={
        <ChartLine
          size={16}
          color={isSelected ? brandColor : theme.black}
        />
      }
      isSelected={isSelected}
    />
  );
}

