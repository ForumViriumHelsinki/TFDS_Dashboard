import { Button, Group, Text } from "@mantine/core";
import { ChevronDown, X } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMemo } from "react";
import { useMergedDisturbances } from "../../hooks/useMergedDisturbances";
import { BORDER_COLOR } from "../../main";

export function DataDisplayHeader() {
  const navigate = useNavigate({ from: '/' })
  const { dataPanelOpen } = useSearch({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { isLoading, getSelectedGroupBySegment } = useMergedDisturbances();
  const selectedGroup = useMemo(
    () => getSelectedGroupBySegment(selectedSegment),
    [getSelectedGroupBySegment, selectedSegment]
  );

  return (
    <Group
      justify="space-between"
      px="md"
      py="xs"
      style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
    >
      <Text>{selectedGroup?.landLeaseProperties?.osoite ?? "Unknown"}</Text>
      <Button
        size="xs"
        variant="white"
        onClick={() => navigate({ search: (prev) => ({ ...prev, dataPanelOpen: !dataPanelOpen }), replace: true })}
        color="black"
        leftSection={
          dataPanelOpen ? (
            <X size={16} />
          ) : (
            <ChevronDown size={16} />
          )
        }
        disabled={isLoading}
      >
        {dataPanelOpen ? "Sulje" : "Näytä"}
      </Button>
    </Group>
  );
}

