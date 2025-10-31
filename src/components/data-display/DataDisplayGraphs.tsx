import { Stack, Text } from "@mantine/core";
import { useAtomValue } from "jotai";
import { selectedSegmentAtom } from "../../atoms/segments";

export function DataDisplayGraphs() {
  const selectedSegment = useAtomValue(selectedSegmentAtom);

  return (
    <Stack flex={1} p="md" h="100%">
      <Text>Data display graphs</Text>
      {selectedSegment && <Text size="sm" c="dimmed">Showing data for: {selectedSegment}</Text>}
    </Stack>
  );
}

