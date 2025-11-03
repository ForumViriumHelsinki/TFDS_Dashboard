import { Stack, Text } from "@mantine/core";
import { useSearch } from '@tanstack/react-router'

export function DataDisplayGraphs() {
  const { selectedSegment } = useSearch({ from: '/' })

  return (
    <Stack flex={1} p="md" h="100%">
      <Text>Data display graphs</Text>
      {selectedSegment && <Text size="sm" c="dimmed">Showing data for: {selectedSegment}</Text>}
    </Stack>
  );
}

