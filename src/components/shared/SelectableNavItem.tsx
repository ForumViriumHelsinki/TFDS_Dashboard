import { NavLink, useMantineTheme } from "@mantine/core";
import type { MouseEvent, ReactNode } from "react";

type SelectableNavItemProps = {
  label: string;
  description?: string;
  isSelected: boolean;
  onClick?: () => void;
  leftSection?: ReactNode;
  href?: string;
  preventDefaultOnClick?: boolean;
  dataId?: string;
};

export function SelectableNavItem({
  label,
  description,
  isSelected,
  onClick,
  leftSection,
  href = "#",
  preventDefaultOnClick = false,
  dataId,
}: SelectableNavItemProps) {
  const theme = useMantineTheme();
  const brandColor = theme.colors.brand[0];

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (preventDefaultOnClick) {
      event.preventDefault();
    }
    onClick?.();
  }

  return (
    <NavLink
      href={href}
      onClick={handleClick}
      label={label}
      description={description}
      leftSection={leftSection}
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
      data-id={dataId}
    />
  );
}


