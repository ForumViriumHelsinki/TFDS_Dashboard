import { Group } from "@mantine/core";
import { useAtomValue } from "jotai";
import { dataDisplayOpenedAtom } from "../../atoms/dataDisplay";
import { DataDisplaySidebar } from "./DataDisplaySidebar";
import { DataDisplayGraphs } from "./DataDisplayGraphs";

export function DataDisplayContent() {
  const dataDisplayOpened = useAtomValue(dataDisplayOpenedAtom);

  return (
    <Group
      h="100%"
      gap={0}
      align="flex-start"
      display={dataDisplayOpened ? "flex" : "none"}
    >
      <DataDisplaySidebar />
      <DataDisplayGraphs />
    </Group>
  );
}

