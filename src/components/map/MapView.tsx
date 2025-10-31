import { Box, Text } from "@mantine/core";
import { useAtomValue } from "jotai";
import { selectedSegmentAtom } from "../../atoms/segments";

export function MapView() {
  const selectedSegment = useAtomValue(selectedSegmentAtom);

  return (
    <Box bg="gray.1" p="md" flex={1} h="100%">
      <Text>Map content</Text>
      {selectedSegment && <Text size="sm" c="dimmed">Selected: {selectedSegment}</Text>}
    </Box>
  );
}

