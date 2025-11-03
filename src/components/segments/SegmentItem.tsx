import { NavLink } from "@mantine/core";
import { ChartLine } from "lucide-react";

interface SegmentItemProps {
  segmentId: string;
  segmentLabel: string;
  isSelected: boolean;
  onClick: () => void;
}

export function SegmentItem({ segmentId, segmentLabel, isSelected, onClick }: SegmentItemProps) {
  return (
    <NavLink
      href="#"
      onClick={onClick}
      label={segmentLabel}
      description={segmentId}
      leftSection={
        <ChartLine
          size={16}
          color={isSelected ? "#F37438" : "#000"}
        />
      }
      active={isSelected}
      style={{
        borderRight: isSelected ? "3px solid #F37438" : "none",
      }}
      styles={{
        label: {
          color: "black",
        },
        description: {
          color: "#5C5F66",
        },
      }}
    />
  );
}

