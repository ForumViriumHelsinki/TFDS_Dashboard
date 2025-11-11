
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SegmentItem } from "./SegmentItem";
import { Accordion, Group, Text } from '@mantine/core';
import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useMergedDisturbances } from '../../hooks/useMergedDisturbances';

export function SegmentList() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment, landLeaseSearch } = useSearch({ from: '/' })
  const { groups, isLoading, error } = useMergedDisturbances();

  const handleSegmentClick = (segmentId: string) => {
    navigate({ search: (prev) => ({ ...prev, selectedSegment: segmentId, dataPanelOpen: true }), replace: true })
  };

  const normalizedQuery = (landLeaseSearch ?? '').trim().toLowerCase();

  const fuse = useMemo(() => {
    return new Fuse(groups, {
      keys: ['landLeaseProperties.osoite', 'landLeaseProperties.hakemustunnus'],
      threshold: 0.1,
      ignoreLocation: true,
      isCaseSensitive: false,
    });
  }, [groups]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups;
    return fuse.search(normalizedQuery).map((result) => result.item);
  }, [normalizedQuery, groups, fuse]);

  return (
    <>
      {isLoading && <div style={{ padding: 8 }}>Ladataan…</div>}
      {error && (
        <div style={{ padding: 8, color: "#C92A2A" }}>
          {(() => {
            const err = error;
            const msg = err instanceof Error ? err.message : 'Tuntematon virhe';
            return `Virhe: ${msg}`;
          })()}
        </div>
      )}
      <Accordion chevronPosition="right" chevronSize={18} variant="contained" defaultValue={undefined}>
        {filteredGroups.map((group) => {
          const areaId = group.id;
          const typeLabel = group.type === 'Kaivuilmoitus' ? 'Kaivuilmoitus' : 'Aluevuokraus';
          const address = group.landLeaseProperties?.osoite;
          const header = (address || `${typeLabel} ${areaId}`).trim();
          return (
            <Accordion.Item key={`${group.type}:${areaId}`} value={`${group.type}:${areaId}`}>
              <Accordion.Control onClick={() => {/* selecting area optional */}}>
                <Group justify="space-between">
                  <div>
                    <Text fw={600} lineClamp={1}>{header}</Text>
                    <Text size="sm" c="dimmed">{`${typeLabel} ${areaId}`}</Text>
                  </div>
                </Group>
              </Accordion.Control>
              <Accordion.Panel styles={{ content: { padding: 0 } }}>
                {Object.keys(group.segments).map((segmentId) => (
                  <SegmentItem
                    key={segmentId}
                    segmentId={segmentId}
                    segmentLabel={"IDEA Segment"}
                    isSelected={selectedSegment === segmentId}
                    onClick={() => handleSegmentClick(segmentId)}
                  />
                ))}
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
      {filteredGroups.length === 0 && !isLoading && (
        <div style={{ padding: 8 }}>Ei osumia hakuehdolla.</div>
      )}
    </>
  );
}

