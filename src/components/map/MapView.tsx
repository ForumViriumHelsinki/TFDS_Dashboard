import { Box, Text } from "@mantine/core";
import { useSearch } from '@tanstack/react-router'

export function MapView() {
  const { segment = '' } = useSearch({ from: '/' })

  return (
    <Box bg="gray.1" p="md" flex={1} h="100%">
      <Text>Map content</Text>
      {segment && <Text size="sm" c="dimmed">Selected: {segment}</Text>}
    </Box>
  );
}

