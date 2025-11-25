import { Circle } from "lucide-react";
import { SelectableNavItem } from "../shared/SelectableNavItem";

interface AirQualityStationItemProps {
  id: string;
  label: string;
  description: string;
  colorHex: string;
  isSelected: boolean;
  onClick: () => void;
}

export function AirQualityStationItem({
  id,
  label,
  description,
  colorHex,
  isSelected,
  onClick,
}: AirQualityStationItemProps) {
  return (
    <SelectableNavItem
      href="#required-for-focus"
      preventDefaultOnClick
      onClick={onClick}
      label={label}
      description={description}
      leftSection={<Circle size={16} color={colorHex} fill={colorHex} />}
      isSelected={isSelected}
      dataId={id}
    />
  );
}


