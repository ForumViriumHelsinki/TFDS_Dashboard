
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SegmentItem } from "./SegmentItem";
import { useQuery } from '@tanstack/react-query';
import { getListLandLeaseQueryOptions, landLeaseTypes, LandLeaseProps } from '../../queries/land-leases';
import { Accordion, Group, Text } from '@mantine/core';
import { useMemo } from 'react';
import { buildDisturbanceMapFromJson } from '../../utils/invertTrafficDisturbances';
import type { Feature as GFeature, MultiPolygon } from 'geojson';
import Fuse from 'fuse.js';


export function SegmentList() {
  const navigate = useNavigate({ from: '/' })
  const { selectedSegment, landLeaseSearch } = useSearch({ from: '/' })
  const { isPending: isPendingExc, data: excData, error: excError } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.EXCAVATION_NOTICE_AREA }),
  );
  const { isPending: isPendingLease, data: leaseData, error: leaseError } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: landLeaseTypes.LAND_LEASE_AREA }),
  );

  const inverted = useMemo(() => buildDisturbanceMapFromJson(), []);

  const handleSegmentClick = (segmentId: string) => {
    navigate({ search: (prev) => ({ ...prev, selectedSegment: segmentId, dataPanelOpen: true }), replace: true })
  };

  const normalizedQuery = (landLeaseSearch ?? '').trim().toLowerCase();

  const fuse = useMemo(() => {
    const groups = Object.values(inverted);
    const items = groups.map((group) => {
      const areaId = group.id;
      const feature = group.type === 'Kaivuilmoitus'
        ? excData?.features.find((f: GFeature<MultiPolygon, LandLeaseProps>) => f.properties?.id === areaId)
        : leaseData?.features.find((f: GFeature<MultiPolygon, LandLeaseProps>) => f.properties?.id === areaId);
      const properties = feature?.properties;
      return {
        group,
        address: properties?.osoite ?? '',
        hakemustunnus: properties?.hakemustunnus ?? '',
      };
    });
    return new Fuse(items, {
      keys: ['address', 'hakemustunnus'],
      threshold: 0.1,
      ignoreLocation: true,
      isCaseSensitive: false,
    });
  }, [inverted, excData, leaseData]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return Object.values(inverted);
    return fuse.search(normalizedQuery).map((result) => result.item.group);
  }, [normalizedQuery, inverted, fuse]);

  return (
    <>
      {(isPendingExc || isPendingLease) && <div style={{ padding: 8 }}>Ladataan…</div>}
      {(excError || leaseError) && (
        <div style={{ padding: 8, color: "#C92A2A" }}>
          {(() => {
            const err = (excError ?? leaseError);
            const msg = err instanceof Error ? err.message : 'Tuntematon virhe';
            return `Virhe: ${msg}`;
          })()}
        </div>
      )}
      <Accordion chevronPosition="right" chevronSize={18} variant="contained" defaultValue={undefined}>
        {filteredGroups.map((group) => {
          const areaId = group.id;
          const typeLabel = group.type === 'Kaivuilmoitus' ? 'Kaivuilmoitus' : 'Aluevuokraus';
          const feature = group.type === 'Kaivuilmoitus'
            ? excData?.features.find((f: GFeature<MultiPolygon, LandLeaseProps>) => f.properties?.id === areaId)
            : leaseData?.features.find((f: GFeature<MultiPolygon, LandLeaseProps>) => f.properties?.id === areaId);
          const address = feature?.properties?.osoite;
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
      {filteredGroups.length === 0 && !(isPendingExc || isPendingLease) && (
        <div style={{ padding: 8 }}>Ei osumia hakuehdolla.</div>
      )}
    </>
  );
}

