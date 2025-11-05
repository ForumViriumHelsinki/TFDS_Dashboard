import { Button, Group, Text } from "@mantine/core";
import { ChevronDown, X } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { getListLandLeaseQueryOptions, LandLeaseProps, landLeaseTypes } from "../../queries/land-leases";
import { useQuery } from "@tanstack/react-query";

export function DataDisplayHeader() {
  const navigate = useNavigate({ from: '/' })
  const { dataPanelOpen } = useSearch({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { isPending, data } = useQuery(
    getListLandLeaseQueryOptions({ landLeaseType: selectedSegment ? landLeaseTypes.EXCAVATION_NOTICE_AREA : landLeaseTypes.LAND_LEASE_AREA }),
  );

  const selectedLandLease = data?.features.find((feature) => {
    const properties = feature.properties as LandLeaseProps;
    return String(feature.id ?? properties.hakemustunnus ?? 0) === selectedSegment;
  });

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
        disabled={isPending}
      >
        {dataPanelOpen ? "Sulje" : "Näytä"}
      </Button>
    </Group>
  );
}

