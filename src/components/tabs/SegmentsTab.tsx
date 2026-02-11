import {
  AppShell,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { getFloatingCarDataQueryOptions } from "../../queries/floating-car-data";
import { getSegmentsMappingQueryOptions } from "../../queries/traffic-disturbances";
import { SegmentItem } from "../segments/SegmentItem";
import { SegmentMeasurementFieldSelect } from "../segments/SegmentMeasurementFieldSelect";

export function SegmentsTab() {
  const theme = useMantineTheme();
  const navigate = useNavigate({ from: "/" });
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

  const {
    data: segmentsMapping,
    isLoading: isSegmentsMappingLoading,
    isFetching: isSegmentsMappingFetching,
    isError: isSegmentsMappingError,
    error: segmentsMappingError,
    refetch: refetchSegmentsMapping,
  } = useQuery(getSegmentsMappingQueryOptions());

  const segmentIds = useMemo(() => {
    const ids = Object.keys(segmentsMapping?.segmentId ?? {});
    ids.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
    return ids;
  }, [segmentsMapping]);

  const handleSegmentClick = (segmentId: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        selectedSegment: segmentId,
        dataPanelOpen: true,
      }),
      replace: true,
    });
  };

  return (
    <>
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
        <Group justify="space-between" mb="sm" gap="md">
          <Button
            size="xs"
            variant="light"
            onClick={() => refetchSegmentsMapping()}
            loading={isSegmentsMappingFetching}
          >
            Refresh segments mapping
          </Button>
          <Text size="xs" c={isSegmentsMappingError ? "red" : "dimmed"}>
            {isSegmentsMappingError
              ? `Segments mapping error: ${
                  segmentsMappingError?.message ?? "unknown"
                }`
              : isSegmentsMappingLoading
                ? "Loading segments mapping…"
                : `Segments: ${segmentIds.length}`}
          </Text>
        </Group>
        <SegmentMeasurementFieldSelect />
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea} mx="-md" px="md" type="never">
        {isSegmentsMappingLoading ? (
          <Text size="sm" c="dimmed" p="md">
            Loading road segments…
          </Text>
        ) : isSegmentsMappingError ? (
          <Text size="sm" c="red" p="md">
            Failed to load road segments.
          </Text>
        ) : segmentIds.length === 0 ? (
          <Text size="sm" c="dimmed" p="md">
            No segments found in `segments_mapping.json`.
          </Text>
        ) : (
          <Stack gap={0} p="md">
            {segmentIds.map((segmentId) => (
              <div key={segmentId} data-segment-id={segmentId}>
                <SegmentItem
                  segmentId={segmentId}
                  segmentLabel="IDEA Segment"
                  isSelected={selectedSegment === segmentId}
                  onClick={() => handleSegmentClick(segmentId)}
                />
              </div>
            ))}
          </Stack>
        )}
      </AppShell.Section>
    </>
  );
}
