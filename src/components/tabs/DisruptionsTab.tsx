import { AppShell, ScrollArea } from "@mantine/core";
import { SegmentSearch } from "../segments/SegmentSearch";
import { SegmentList } from "../segments/SegmentList";

export function DisruptionsTab() {
  return (
    <>
      <AppShell.Section
        p="md"
        style={{ borderBottom: "1px solid #F1F3F5" }}
      >
        <SegmentSearch />
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

