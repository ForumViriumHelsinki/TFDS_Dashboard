import { AppShell, ScrollArea, Text } from "@mantine/core";

export function SegmentsTab() {
  return (
    <AppShell.Section grow component={ScrollArea} mx="-md" px="md" type="never">
      <Text c="dimmed" mt="md">
        Segments view is under construction.
      </Text>
    </AppShell.Section>
  );
}
