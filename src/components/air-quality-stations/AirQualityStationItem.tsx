import { NavLink, useMantineTheme } from "@mantine/core";
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
  const theme = useMantineTheme();
  const brandColor = theme.colors.brand[0];
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
      data-id={id}
    />
  );
}


