import {
  AppShell,
  Button,
  Group,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { LandLeaseSearch } from "../segments/LandLeaseSearch";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSearch } from "@tanstack/react-router";
import { getFloatingCarDataQueryOptions } from "../../queries/floating-car-data";

export function SegmentsTab() {
  const theme = useMantineTheme();
  const { selectedSegment, selectedStartDate, selectedEndDate } = useSearch({
    from: "/",
  });
  const { start, end } = useMemo(() => {
    const effectiveEnd = selectedEndDate ?? new Date();
    const effectiveStart =
      selectedStartDate ??
      new Date(effectiveEnd.getTime() - 12 * 60 * 60 * 1000);
    return { start: effectiveStart, end: effectiveEnd };
  }, [selectedEndDate, selectedStartDate]);

  const {
    data: fcdRows,
    isFetching: isFcdFetching,
    isError: isFcdError,
    error: fcdError,
    refetch: refetchFcd,
  } = useQuery({
    ...getFloatingCarDataQueryOptions({
      start,
      end,
      segmentId: selectedSegment ?? "",
    }),
    enabled: false,
  });

  const fcdCount = Array.isArray(fcdRows) ? fcdRows.length : 0;

  return (
    <AppShell.Section grow component={ScrollArea} mx="-md" px="md" type="never">
      <AppShell.Section
        p="md"
        style={{ borderBottom: `1px solid ${theme.colors.gray[3]}` }}
      >
        <Group justify="space-between" mb="sm" gap="md">
          <Button
            size="xs"
            onClick={() => refetchFcd()}
            disabled={!selectedSegment}
            loading={isFcdFetching}
          >
            Test FCD Query
          </Button>
          <Text size="xs" c={isFcdError ? "red" : "dimmed"}>
            {isFcdError
              ? `FCD error: ${fcdError?.message ?? "unknown"}`
              : `FCD rows: ${fcdCount}`}
          </Text>
        </Group>
        <LandLeaseSearch />
      </AppShell.Section>
      Segments view is under construction.
    </AppShell.Section>
  );
}
