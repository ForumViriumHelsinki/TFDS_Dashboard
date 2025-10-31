import { Tabs } from "@mantine/core";
import { DisruptionsTab } from "../tabs/DisruptionsTab";
import { AirQualityTab } from "../tabs/AirQualityTab";

export function Sidebar() {
  return (
    <Tabs
      defaultValue="Häiriöt"
      h="100%"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Tabs.List grow>
        <Tabs.Tab value="Häiriöt">Häiriöt</Tabs.Tab>
        <Tabs.Tab value="Ilmanlaatu">Ilmanlaatu</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel
        value="Häiriöt"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <DisruptionsTab />
      </Tabs.Panel>

      <Tabs.Panel value="Ilmanlaatu" p="md">
        <AirQualityTab />
      </Tabs.Panel>
    </Tabs>
  );
}

