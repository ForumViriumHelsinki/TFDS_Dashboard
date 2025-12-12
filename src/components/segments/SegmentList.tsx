import { useNavigate, useSearch } from "@tanstack/react-router";
import { SegmentItem } from "./SegmentItem";
import { Accordion, Group, Text, useMantineTheme } from "@mantine/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { useMergedDisturbances } from "../../hooks/useMergedDisturbances";

export function SegmentList() {
  const theme = useMantineTheme();
  const navigate = useNavigate({ from: "/" });
  const { selectedSegment, landLeaseSearch } = useSearch({ from: "/" });
  const { groups, isLoading, error, getSelectedGroupBySegment } =
    useMergedDisturbances();
  const [accordionManualValues, setAccordionManualValues] = useState<string[]>(
    [],
  );
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const normalizedQuery = (landLeaseSearch ?? "").trim().toLowerCase();

  const fuse = useMemo(() => {
    return new Fuse(groups, {
      keys: ["landLeaseProperties.osoite", "landLeaseProperties.hakemustunnus"],
      threshold: 0.1,
      ignoreLocation: true,
      isCaseSensitive: false,
    });
  }, [groups]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups;
    return fuse.search(normalizedQuery).map((result) => result.item);
  }, [normalizedQuery, groups, fuse]);

  // Derive which accordion item should be open from the selected segment
  const selectedGroupValue = useMemo(() => {
    const selectedGroup = getSelectedGroupBySegment(selectedSegment);
    return selectedGroup ? `${selectedGroup.type}:${selectedGroup.id}` : null;
  }, [selectedSegment, getSelectedGroupBySegment]);

  const effectiveAccordionValues = useMemo(() => {
    const set = new Set<string>(accordionManualValues);
    if (selectedGroupValue) set.add(selectedGroupValue);
    return Array.from(set);
  }, [accordionManualValues, selectedGroupValue]);

  const ensureElementVisibleWithinContainer = useCallback(
    (target: HTMLElement) => {
      const getNearestScrollableAncestor = (
        element: HTMLElement | null,
      ): HTMLElement | null => {
        let node: HTMLElement | null = element?.parentElement ?? null;
        while (node) {
          const style = window.getComputedStyle(node);
          const overflowY = style.overflowY;
          const isScrollableY =
            overflowY === "auto" ||
            overflowY === "scroll" ||
            overflowY === "overlay";
          const canScroll = node.scrollHeight > node.clientHeight + 1;
          if (isScrollableY && canScroll) return node;
          node = node.parentElement;
        }
        return null;
      };
      const container =
        getNearestScrollableAncestor(target) ??
        (document.scrollingElement as HTMLElement | null) ??
        document.body;
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      if (
        targetRect.top >= containerRect.top &&
        targetRect.bottom <= containerRect.bottom
      ) {
        return;
      }
      const margin = 16;
      const targetCenterOffset =
        targetRect.top -
        containerRect.top -
        container.clientHeight / 2 +
        targetRect.height / 2;
      const desiredTop = Math.max(
        0,
        container.scrollTop + targetCenterOffset - margin,
      );
      container.scrollTo({ top: desiredTop, behavior: "smooth" });
    },
    [],
  );

  // Scroll the selected segment into view when it changes (after accordion opens/animates)
  useEffect(() => {
    if (!selectedSegment) return;
    const element = itemRefs.current[selectedSegment];
    if (!element) return;
    // Try a few times to account for accordion transition/layout settling
    let attemptsRemaining = 3;
    const scheduleTry = (delayMs: number) => {
      const id = window.setTimeout(() => {
        ensureElementVisibleWithinContainer(element);
        attemptsRemaining -= 1;
        if (attemptsRemaining > 0) {
          // Increase delay slightly for next attempt
          scheduleTry(120);
        }
      }, delayMs);
      return () => window.clearTimeout(id);
    };
    // First attempt next frame, then retry after small delays
    const requestAnimationFrameId = requestAnimationFrame(() =>
      ensureElementVisibleWithinContainer(element),
    );
    const cancelTimeout = scheduleTry(80);
    return () => {
      cancelAnimationFrame(requestAnimationFrameId);
      cancelTimeout();
    };
  }, [selectedSegment, ensureElementVisibleWithinContainer]);

  return (
    <>
      {isLoading && <div style={{ padding: theme.spacing.xs }}>Ladataan…</div>}
      {error && (
        <div style={{ padding: theme.spacing.xs, color: theme.colors.red[7] }}>
          {(() => {
            const errorValue = error;
            const message =
              errorValue instanceof Error
                ? errorValue.message
                : "Tuntematon virhe";
            return `Virhe: ${message}`;
          })()}
        </div>
      )}
      <Accordion
        chevronPosition="right"
        chevronSize={18}
        variant="contained"
        multiple
        value={effectiveAccordionValues}
        onChange={setAccordionManualValues}
      >
        {filteredGroups.map((group) => {
          const areaId = group.id;
          const typeLabel =
            group.type === "Kaivuilmoitus" ? "Kaivuilmoitus" : "Aluevuokraus";
          const address = group.landLeaseProperties?.osoite;
          const header = (address || `${typeLabel} ${areaId}`).trim();
          return (
            <Accordion.Item
              key={`${group.type}:${areaId}`}
              value={`${group.type}:${areaId}`}
            >
              <Accordion.Control>
                <Text fw={600} lineClamp={1}>
                  {header}
                </Text>
                <Text size="sm" c="dimmed">{`${typeLabel} ${areaId}`}</Text>
              </Accordion.Control>
              <Accordion.Panel styles={{ content: { padding: 0 } }}>
                {Object.keys(group.segments).map((segmentId) => (
                  <div
                    key={segmentId}
                    ref={(element) => {
                      itemRefs.current[segmentId] = element;
                    }}
                    data-segment-id={segmentId}
                  >
                    <SegmentItem
                      segmentId={segmentId}
                      segmentLabel={"IDEA Segment"}
                      isSelected={selectedSegment === segmentId}
                      onClick={() => handleSegmentClick(segmentId)}
                    />
                  </div>
                ))}
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
      {filteredGroups.length === 0 && !isLoading && (
        <Group p="md">
          <Text>Ei näytettäviä segmenttejä.</Text>
        </Group>
      )}
    </>
  );
}
