import { Button, Group, Text } from "@mantine/core";
import { ChevronDown, X } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { AlluProps, disruptionsAtom } from "../../atoms/disruptions";
import { useAtomValue } from "jotai";

export function DataDisplayHeader() {
  const navigate = useNavigate({ from: '/' })
  const { dataPanelOpen } = useSearch({ from: '/' })
  const { selectedSegment } = useSearch({ from: '/' })
  const { kaivuilmoitukset } = useAtomValue(disruptionsAtom);
  const selectedAllu = kaivuilmoitukset?.features.find((f) => {
    const p = f.properties as AlluProps;
    return String(f.id ?? p.hakemustunnus ?? 0) === selectedSegment;
  });

  return (
    <Group
      justify="space-between"
      px="md"
      py="xs"
      style={{ borderBottom: "1px solid #F1F3F5" }}
    >
      <Text>{selectedAllu?.properties?.osoite ?? "Unknown"}</Text>
      <Button
        size="xs"
        variant="white"
        onClick={() => navigate({ search: (p) => ({ ...p, dataPanelOpen: !dataPanelOpen }), replace: true })}
        color="black"
        leftSection={
          dataPanelOpen ? (
            <X size={16} />
          ) : (
            <ChevronDown size={16} />
          )
        }
      >
        {dataPanelOpen ? "Sulje" : "Näytä"}
      </Button>
    </Group>
  );
}

