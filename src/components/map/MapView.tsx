import { Box, Text } from "@mantine/core";
import { useSearch } from '@tanstack/react-router'

export function MapView() {
  const { selectedSegment } = useSearch({ from: '/' })

  return (
    <Box bg="gray.1" p="md" flex={1} h="100%">
      <Text>Map content</Text>
      {selectedSegment && <Text size="sm" c="dimmed">Selected: {selectedSegment}</Text>}
    </Box>
  );
}

