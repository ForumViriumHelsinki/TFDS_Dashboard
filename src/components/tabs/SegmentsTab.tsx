import {
  AppShell,
  Group,
  ScrollArea,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { getFloatingCarDataAllFieldsBySegmentQueryOptions } from "../../queries/floating-car-data";
import { getSegmentsMappingQueryOptions } from "../../queries/traffic-disturbances";
import { SegmentItem } from "../segments/SegmentItem";
import {
  SegmentMeasurementFieldSelect,
  measurementFieldOptions,
} from "../segments/SegmentMeasurementFieldSelect";

export function SegmentsTab() {
  const theme = useMantineTheme();
  const navigate = useNavigate({ from: "/" });
  const {
    selectedSegment,
    selectedStartDate,
    selectedEndDate,
    segmentMeasurementField,
  } = useSearch({
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
    data: segmentRows,
    isFetching: isSegmentFieldFetching,
    isError: isSegmentFieldError,
    error: segmentFieldError,
  } = useQuery({
    ...getFloatingCarDataAllFieldsBySegmentQueryOptions({
      start,
      end,
    }),
  });

  const segmentFieldLabel = useMemo(() => {
    if (!segmentMeasurementField) return null;
    return (
      measurementFieldOptions.find(
        (option) => option.value === segmentMeasurementField,
      )?.label ?? segmentMeasurementField
    );
  }, [segmentMeasurementField]);

  const segmentFieldById = useMemo(() => {
    if (!Array.isArray(segmentRows) || !segmentMeasurementField) {
      return new Map<string, string>();
    }
    const entries = new Map<string, string>();
    for (const row of segmentRows) {
      const segmentId = String(row["segmentId"] ?? "").trim();
      if (!segmentId) continue;
      const rawValue = row[segmentMeasurementField];
      if (rawValue === null || rawValue === undefined) continue;
      let formatted: string;
      if (typeof rawValue === "number") {
        const rounded = Math.round(rawValue * 10) / 10;
        formatted = Number.isFinite(rounded) ? String(rounded) : "";
      } else {
        formatted = String(rawValue);
      }
      if (formatted.length === 0) continue;
      entries.set(segmentId, formatted);
    }
    return entries;
  }, [segmentRows, segmentMeasurementField]);

  const {
    data: segmentsMapping,
    isLoading: isSegmentsMappingLoading,
    isError: isSegmentsMappingError,
    error: segmentsMappingError,
  } = useQuery(getSegmentsMappingQueryOptions());

  const segmentIds = useMemo(() => {
    const ids = Object.keys(segmentsMapping?.segmentId ?? {});
    ids.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
    return ids;
  }, [segmentsMapping]);

  const filteredSegmentIds = useMemo(() => {
    if (!segmentMeasurementField) return segmentIds;
    return segmentIds.filter((segmentId) => segmentFieldById.has(segmentId));
  }, [segmentIds, segmentFieldById, segmentMeasurementField]);

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
        <Text size="xs" c={isSegmentFieldError ? "red" : "dimmed"} mb="sm">
          {!segmentMeasurementField
            ? "Valitse muuttuja nähdäksesi FCD-arvot."
            : isSegmentFieldFetching
              ? "Ladataan FCD-arvoja…"
              : isSegmentFieldError
                ? `FCD error: ${segmentFieldError?.message ?? "unknown"}`
                : `FCD-arvoja (${segmentFieldLabel ?? segmentMeasurementField}): ${
                    filteredSegmentIds.length
                  } segmentille`}
        </Text>
        <Group justify="space-between" mb="sm" gap="md">
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
        ) : filteredSegmentIds.length === 0 ? (
          <Text size="sm" c="dimmed" p="md">
            {segmentMeasurementField
              ? "Ei segmenttejä valitulla muuttujalla ja aikavälillä."
              : "No segments found in `segments_mapping.json`."}
          </Text>
        ) : (
          <Stack gap={0} p="md">
            {filteredSegmentIds.map((segmentId) => (
              <div key={segmentId} data-segment-id={segmentId}>
                <SegmentItem
                  segmentId={segmentId}
                  segmentLabel="IDEA Segment"
                  isSelected={selectedSegment === segmentId}
                  measurementText={segmentFieldById.get(segmentId)}
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
