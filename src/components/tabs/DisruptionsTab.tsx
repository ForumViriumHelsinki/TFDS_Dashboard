import { AppShell, ScrollArea, useMantineTheme } from "@mantine/core";
import { SegmentList } from "../segments/SegmentList";
import { LandLeaseSearch } from "../segments/LandLeaseSearch";

export function DisruptionsTab() {
  const theme = useMantineTheme();
  return (
    <>
      <AppShell.Section
        p="md"
        style={{ borderBottom: `1px solid ${theme.colors.gray[3]}` }}
      >
        <LandLeaseSearch />
      </AppShell.Section>
      <AppShell.Section
        grow
        component={ScrollArea}
        mx="-md"
        px="md"
        type="never"
      >
        <SegmentList />
      </AppShell.Section>
    </>
  );
}
