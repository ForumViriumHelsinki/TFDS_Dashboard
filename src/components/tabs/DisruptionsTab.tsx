import { AppShell, ScrollArea } from "@mantine/core";
import { SegmentList } from "../segments/SegmentList";
import { LandLeaseSearch } from "../segments/LandLeaseSearch";

export function DisruptionsTab() {
  return (
    <>
      <AppShell.Section
        p="md"
        style={{ borderBottom: "1px solid #F1F3F5" }}
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

