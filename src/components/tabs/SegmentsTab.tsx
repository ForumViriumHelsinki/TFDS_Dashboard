import {
  AppShell,
  ScrollArea,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { getSegmentMeasurementFieldConfig } from "../../constants/segment-fields";
import { getFcdBySegmentQueryOptions } from "../../queries/floating-car-data";
import { getSegmentsMappingQueryOptions } from "../../queries/traffic-disturbances";
import { getDefaultDateRange } from "../../utils/time";
import { SegmentItem } from "../segments/SegmentItem";
import { SegmentMeasurementFieldSelect } from "../segments/SegmentMeasurementFieldSelect";
import { LoadingState } from "../shared/LoadingState";

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
  const fallbackRange = useMemo(() => getDefaultDateRange(), []);
  const { start, end } = useMemo(() => {
    const effectiveEnd = selectedEndDate ?? fallbackRange.end;
    const effectiveStart = selectedStartDate ?? fallbackRange.start;
    return { start: effectiveStart, end: effectiveEnd };
  }, [fallbackRange.end, fallbackRange.start, selectedEndDate, selectedStartDate]);
  const {
    data: segmentRows,
    isPending: isSegmentFieldPending,
    isFetching: isSegmentFieldFetching,
    isError: isSegmentFieldError,
  } = useQuery({
    ...getFcdBySegmentQueryOptions({
      start,
      end,
    }),
  });

  const segmentIdsWithSelectedField = useMemo(() => {
    if (!Array.isArray(segmentRows) || !segmentMeasurementField) {
      return new Set<string>();
    }
    const ids = new Set<string>();
    for (const row of segmentRows) {
      const segmentId = String(row["segmentId"] ?? "").trim();
      if (!segmentId) continue;
      const rawValue = row[segmentMeasurementField];
      if (rawValue === null || rawValue === undefined) continue;
      ids.add(segmentId);
    }
    return ids;
  }, [segmentRows, segmentMeasurementField]);

  const {
    data: segmentsMapping,
    isLoading: isSegmentsMappingLoading,
    isError: isSegmentsMappingError,
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
    return segmentIds.filter((segmentId) =>
      segmentIdsWithSelectedField.has(segmentId),
    );
  }, [segmentIds, segmentIdsWithSelectedField, segmentMeasurementField]);
  const selectedFieldConfig = getSegmentMeasurementFieldConfig(
    segmentMeasurementField,
  );
  const isSegmentsDataLoading =
    isSegmentsMappingLoading ||
    isSegmentFieldPending ||
    isSegmentFieldFetching;

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
        <SegmentMeasurementFieldSelect disabled={isSegmentsDataLoading} />
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea} mx="-md" px="md" type="never">
        {isSegmentsMappingLoading ? (
          <LoadingState message="Haetaan tiesegmenttejä…" />
        ) : isSegmentsMappingError ? (
          <Text size="sm" c="red" p="md">
            Tiesegmenttien lataus epäonnistui.
          </Text>
        ) : segmentMeasurementField && isSegmentFieldError ? (
          <Text size="sm" c="red" p="md">
            {selectedFieldConfig
              ? `${selectedFieldConfig.label}-datan lataus epäonnistui.`
              : "FCD-datan lataus epäonnistui."}
          </Text>
        ) : segmentMeasurementField &&
          (!Array.isArray(segmentRows) ||
            isSegmentFieldPending ||
            isSegmentFieldFetching) ? (
          <LoadingState message="Haetaan FCD-arvoja segmenteille…" />
        ) : filteredSegmentIds.length === 0 ? (
          <Text size="sm" c="dimmed" p="md">
            {segmentMeasurementField
              ? "Ei segmenttejä valitulla muuttujalla ja aikavälillä."
              : "Tiedostosta `segments_mapping.json` ei löytynyt segmenttejä."}
          </Text>
        ) : (
          <Stack gap={0}>
            {filteredSegmentIds.map((segmentId) => (
              <div key={segmentId} data-segment-id={segmentId}>
                <SegmentItem
                  segmentId={segmentId}
                  segmentLabel="IDEA-segmentti"
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
