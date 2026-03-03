import { Tabs } from "@mantine/core";
import { DisruptionsTab } from "../tabs/DisruptionsTab";
import { AirQualityTab } from "../tabs/AirQualityTab";
import { SegmentsTab } from "../tabs/SegmentsTab";
import { useFlag } from "@openfeature/react-sdk";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

export function Sidebar() {
  const { value: showSegmentsTab } = useFlag("tfds-segments-tab", false);
  const navigate = useNavigate({ from: "/" });
  const { activeTab } = useSearch({
    from: "/",
    select: (s) => ({
      activeTab: s.activeTab,
    }),
  });
  const effectiveTab =
    activeTab === "Segmentit" && !showSegmentsTab ? "Häiriöt" : activeTab;

  useEffect(() => {
    if (showSegmentsTab) return;
    if (activeTab !== "Segmentit") return;
    navigate({
      search: (prev) => ({
        ...prev,
        activeTab: "Häiriöt",
      }),
      replace: true,
    });
  }, [activeTab, navigate, showSegmentsTab]);

  return (
    <Tabs
      value={effectiveTab}
      onChange={(nextValue) => {
        if (!nextValue) return;
        navigate({
          search: (prev) => ({
            ...prev,
            activeTab: nextValue,
          }),
          replace: true,
        });
      }}
      h="100%"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Tabs.List grow>
        <Tabs.Tab value="Häiriöt">Häiriöt</Tabs.Tab>
        <Tabs.Tab value="Ilmanlaatu">Ilmanlaatu</Tabs.Tab>
        {showSegmentsTab && <Tabs.Tab value="Segmentit">Segmentit</Tabs.Tab>}
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
          value="Segmentit"
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
