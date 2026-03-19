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
import {
  getSegmentMeasurementFieldConfig,
  getSegmentMeasurementFieldQueryField,
  usesSpeedLimitBaseline,
} from "../../constants/segment-fields";
import { getFcdBySegmentQueryOptions } from "../../queries/floating-car-data";
import { getSegmentSpeedLimitsQueryOptions } from "../../queries/segment-speed-limits";
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
    select: (s) => ({
      selectedSegment: s.selectedSegment,
      selectedStartDate: s.selectedStartDate,
      selectedEndDate: s.selectedEndDate,
      segmentMeasurementField: s.segmentMeasurementField,
    }),
  });
  const fallbackRange = useMemo(() => getDefaultDateRange(), []);
  const start = selectedStartDate ?? fallbackRange.start;
  const end = selectedEndDate ?? fallbackRange.end;
  const selectedQueryField = getSegmentMeasurementFieldQueryField(
    segmentMeasurementField,
  );
  const selectedFieldUsesSpeedLimit = usesSpeedLimitBaseline(
    segmentMeasurementField,
  );
  const {
    data: segmentRows,
    isPending: isSegmentFieldPending,
    isFetching: isSegmentFieldFetching,
    isError: isSegmentFieldError,
  } = useQuery(
    getFcdBySegmentQueryOptions({
      start,
      end,
    }),
  );
  const {
    data: speedLimits,
    isLoading: isSpeedLimitsLoading,
    isError: isSpeedLimitsError,
  } = useQuery(getSegmentSpeedLimitsQueryOptions());

  const speedLimitBySegmentId = useMemo(
    () => new Map(Object.entries(speedLimits?.segmentId ?? {})),
    [speedLimits],
  );

  const segmentIdsWithSelectedField = useMemo(() => {
    if (!Array.isArray(segmentRows)) {
      return new Set<string>();
    }
    const ids = new Set<string>();
    for (const row of segmentRows) {
      const segmentId = String(row["segmentId"] ?? "").trim();
      if (!segmentId) continue;
      const rawValue = row[selectedQueryField];
      if (rawValue === null || rawValue === undefined) continue;
      if (
        selectedFieldUsesSpeedLimit &&
        !speedLimitBySegmentId.has(segmentId)
      ) {
        continue;
      }
      ids.add(segmentId);
    }
    return ids;
  }, [
    segmentRows,
    selectedFieldUsesSpeedLimit,
    selectedQueryField,
    speedLimitBySegmentId,
  ]);

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

  const filteredSegmentIds = useMemo(
    () =>
      segmentIds.filter((segmentId) =>
        segmentIdsWithSelectedField.has(segmentId),
      ),
    [segmentIds, segmentIdsWithSelectedField],
  );
  const selectedFieldConfig = getSegmentMeasurementFieldConfig(
    segmentMeasurementField,
  );
  const isSegmentsDataLoading =
    isSegmentsMappingLoading ||
    isSegmentFieldPending ||
    isSegmentFieldFetching ||
    (selectedFieldUsesSpeedLimit && isSpeedLimitsLoading);

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

  const renderContent = () => {
    if (isSegmentsMappingLoading) {
      return <LoadingState message="Haetaan tiesegmenttejä…" />;
    }
    if (isSegmentsMappingError) {
      return (
        <Text size="sm" c="red" p="md">
          Tiesegmenttien lataus epäonnistui.
        </Text>
      );
    }
    if (isSegmentFieldError) {
      return (
        <Text size="sm" c="red" p="md">
          {selectedFieldConfig
            ? `${selectedFieldConfig.label}-datan lataus epäonnistui.`
            : "FCD-datan lataus epäonnistui."}
        </Text>
      );
    }
    if (selectedFieldUsesSpeedLimit && isSpeedLimitsError) {
      return (
        <Text size="sm" c="red" p="md">
          Nopeusrajoitusten lataus epäonnistui.
        </Text>
      );
    }
    if (
      !Array.isArray(segmentRows) ||
      isSegmentFieldPending ||
      isSegmentFieldFetching
    ) {
      return <LoadingState message="Haetaan FCD-arvoja segmenteille…" />;
    }
    if (filteredSegmentIds.length === 0) {
      return (
        <Text size="sm" c="dimmed" p="md">
          Ei segmenttejä valitulla muuttujalla ja aikavälillä.
        </Text>
      );
    }

    return (
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
    );
  };

  return (
    <>
      <AppShell.Section
        p="md"
        style={{ borderBottom: `1px solid ${theme.colors.gray[3]}` }}
      >
        <SegmentMeasurementFieldSelect disabled={isSegmentsDataLoading} />
      </AppShell.Section>

      <AppShell.Section
        grow
        component={ScrollArea}
        mx="-md"
        px="md"
        type="never"
      >
        {renderContent()}
      </AppShell.Section>
    </>
  );
}
