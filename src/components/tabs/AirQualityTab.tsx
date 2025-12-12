import { AppShell, ScrollArea } from "@mantine/core";
import { AirQualityStationList } from "../air-quality-stations/AirQualityStationList";

export function AirQualityTab() {
  return (
    <AppShell.Section grow component={ScrollArea} mx="-md" px="md" type="never">
      <AirQualityStationList />
    </AppShell.Section>
  );
}
