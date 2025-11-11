import { Button, Group, Text } from "@mantine/core";
import { ChevronDown, X } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { getListLandLeaseQueryOptions, LandLeaseProps, landLeaseTypes } from "../../queries/land-leases";
import { useQuery } from "@tanstack/react-query";
import { buildDisturbanceMapFromJson } from "../../utils/invertTrafficDisturbances";
import { useMemo } from "react";

export function DataDisplayHeader() {
  const navigate = useNavigate({ from: '/' })
  const { dataPanelOpen } = useSearch({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { isPending: isPendingLandLease, data: landLeaseData } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: selectedSegment ? landLeaseTypes.EXCAVATION_NOTICE_AREA : landLeaseTypes.LAND_LEASE_AREA }),
  );

  const inverted = useMemo(() => buildDisturbanceMapFromJson(), []);
  const matchedApplicationId = useMemo(() => {
    if (!selectedSegment) return undefined;
    const group = Object.values(inverted).find(g => Boolean(g.segments[selectedSegment]));
    return group?.id;
  }, [inverted, selectedSegment]);
  const selectedLandLease = useMemo(() => {
    if (!landLeaseData || !matchedApplicationId) return undefined;
    return landLeaseData.features.find((feature) => {
      const leaseProps = feature.properties as LandLeaseProps | undefined;
      const id = leaseProps?.id ?? "";
      return id === matchedApplicationId;
    });
  }, [landLeaseData, matchedApplicationId]);

  return (
    <Group
      justify="space-between"
      px="md"
      py="xs"
      style={{ borderBottom: "1px solid #F1F3F5" }}
    >
      <Text>{selectedLandLease?.properties?.osoite ?? "Unknown"}</Text>
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
        disabled={isPendingLandLease}
      >
        {dataPanelOpen ? "Sulje" : "Näytä"}
      </Button>
    </Group>
  );
}

