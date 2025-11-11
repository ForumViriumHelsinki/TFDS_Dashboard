import { Box } from "@mantine/core";
import { useSearch } from '@tanstack/react-router'
import { DataDisplayHeader } from "./DataDisplayHeader";
import { DataDisplayContent } from "./DataDisplayContent";

export function DataDisplayPanel() {
  const { dataPanelOpen } = useSearch({ from: '/' })

  return (
    <Box bg="white" flex={dataPanelOpen ? 1 : 0} mah="600px">
      <DataDisplayHeader />
      <DataDisplayContent />
    </Box>
  );
}

