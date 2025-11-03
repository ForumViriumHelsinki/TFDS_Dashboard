import { AppShell, ScrollArea } from "@mantine/core";
import { AirQualityList } from "../air/AirQualityList";

export function AirQualityTab() {
  return (
    <AppShell.Section
      grow
      component={ScrollArea}
      mx="-md"
      type="never"
    >
      <AirQualityList />
    </AppShell.Section>
  );
}

