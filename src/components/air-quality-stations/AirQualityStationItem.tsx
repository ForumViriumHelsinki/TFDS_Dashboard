import { NavLink } from "@mantine/core";
import { Circle } from "lucide-react";

interface AirQualityStationItemProps {
  id: string;
  label: string;
  description: string;
  colorHex: string;
  isSelected: boolean;
  onClick: () => void;
}

export function AirQualityStationItem({ id, label, description, colorHex, isSelected, onClick }: AirQualityStationItemProps) {
  return (
    <NavLink
      href="#required-for-focus"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      label={label}
      description={description}
      leftSection={
        <Circle size={16} color={colorHex} fill={colorHex} />
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
      data-id={id}
    />
  );
}


