import { Group } from "@mantine/core";
import { useSearch } from '@tanstack/react-router'
import { DataDisplaySidebar } from "./DataDisplaySidebar";
import { DataDisplayCharts } from "./DataDisplayCharts";

export function DataDisplayContent() {
  const { dataPanelOpen } = useSearch({ from: '/' })

  return (
    <Group
      h="100%"
      mah="548px"
      gap={0}
      align="flex-start"
      display={dataPanelOpen ? "flex" : "none"}
    >
      <DataDisplaySidebar />
      <DataDisplayCharts />
    </Group>
  );
}

