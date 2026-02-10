import { Tabs } from "@mantine/core";
import { DisruptionsTab } from "../tabs/DisruptionsTab";
import { AirQualityTab } from "../tabs/AirQualityTab";
import { SegmentsTab } from "../tabs/SegmentsTab";
import { useFlag } from "@openfeature/react-sdk";

export function Sidebar() {
  const { value: showSegmentsTab } = useFlag("segments-tab", false);

  return (
    <Tabs
      defaultValue="Häiriöt"
      h="100%"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Tabs.List grow>
        <Tabs.Tab value="Häiriöt">Häiriöt</Tabs.Tab>
        <Tabs.Tab value="Ilmanlaatu">Ilmanlaatu</Tabs.Tab>
        {showSegmentsTab && <Tabs.Tab value="Segments">Segments</Tabs.Tab>}
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

      <Tabs.Panel
        value="Ilmanlaatu"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <AirQualityTab />
      </Tabs.Panel>

      {showSegmentsTab && (
        <Tabs.Panel
          value="Segments"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <SegmentsTab />
        </Tabs.Panel>
      )}
    </Tabs>
  );
}
