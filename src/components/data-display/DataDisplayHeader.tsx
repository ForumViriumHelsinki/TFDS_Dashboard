import { Button, Group, Text, useMantineTheme } from "@mantine/core";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMergedDisturbances } from "../../hooks/useMergedDisturbances";

export function DataDisplayHeader() {
  const theme = useMantineTheme();
  const navigate = useNavigate({ from: "/" });
  const { dataPanelOpen, selectedSegment, activeTab } = useSearch({
    from: "/",
    select: (s) => ({
      dataPanelOpen: s.dataPanelOpen,
      selectedSegment: s.selectedSegment,
      activeTab: s.activeTab,
    }),
  });
  const { isLoading, getSelectedGroupBySegment } = useMergedDisturbances();
  const selectedGroup = useMemo(
    () => getSelectedGroupBySegment(selectedSegment),
    [getSelectedGroupBySegment, selectedSegment],
  );
  const isSegmentsTab = activeTab === "Segmentit";
  const headerLabel = isSegmentsTab
    ? selectedSegment ?? "Valitse IDEA Segment"
    : selectedGroup?.landLeaseProperties?.osoite ?? "Valitse IDEA Segment";
  const hasValue = isSegmentsTab ? Boolean(selectedSegment) : Boolean(selectedGroup);

  return (
    <Group
      justify="space-between"
      px="md"
      py="xs"
      style={{ borderBottom: `1px solid ${theme.colors.gray[3]}` }}
    >
      <Text c={hasValue ? "black" : "dimmed"}>
        {headerLabel}
      </Text>
      <Button
        size="xs"
        variant="white"
        onClick={() =>
          navigate({
            search: (prev) => ({ ...prev, dataPanelOpen: !dataPanelOpen }),
            replace: true,
          })
        }
        color="black"
        leftSection={
          dataPanelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />
        }
        disabled={isLoading}
      >
        {dataPanelOpen ? "Piilota" : "Näytä"}
      </Button>
    </Group>
  );
}
