import { Box } from "@mantine/core";
import { useAtomValue } from "jotai";
import { dataDisplayOpenedAtom } from "../../atoms/dataDisplay";
import { DataDisplayHeader } from "./DataDisplayHeader";
import { DataDisplayContent } from "./DataDisplayContent";

export function DataDisplayPanel() {
  const dataDisplayOpened = useAtomValue(dataDisplayOpenedAtom);

  return (
    <Box bg="white" flex={dataDisplayOpened ? 1 : 0}>
      <DataDisplayHeader />
      <DataDisplayContent />
    </Box>
  );
}

