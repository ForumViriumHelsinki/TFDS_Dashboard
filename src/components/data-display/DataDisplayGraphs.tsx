import { Stack, Text } from "@mantine/core";
import { useSearch } from '@tanstack/react-router'

export function DataDisplayGraphs() {
  const { segment = '' } = useSearch({ from: '/' })

  return (
    <Stack flex={1} p="md" h="100%">
      <Text>Data display graphs</Text>
      {segment && <Text size="sm" c="dimmed">Showing data for: {segment}</Text>}
    </Stack>
  );
}

