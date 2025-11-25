import { NavLink, useMantineTheme } from "@mantine/core";
import { ChartLine } from "lucide-react";

interface SegmentItemProps {
  segmentId: string;
  segmentLabel: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SegmentItem({ segmentId, segmentLabel, isSelected, onClick }: SegmentItemProps) {
  const theme = useMantineTheme();
  const brandColor = theme.colors.brand[0];
  return (
    <NavLink
      href="#"
      onClick={onClick}
      label={segmentLabel}
      description={segmentId}
      leftSection={
        <ChartLine
          size={16}
          color={isSelected ? brandColor : theme.black}
        />
      }
      active={isSelected}
      style={{
        borderRight: isSelected ? `3px solid ${brandColor}` : "none",
      }}
      styles={{
        label: {
          color: theme.black,
        },
        description: {
          color: theme.colors.gray[7],
        },
      }}
    />
  );
}

