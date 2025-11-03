import { Button, Group, Text } from "@mantine/core";
import { ChevronDown, X } from "lucide-react";
import { useNavigate, useSearch } from '@tanstack/react-router'

export function DataDisplayHeader() {
  const navigate = useNavigate({ from: '/' })
  const { dataPanelOpen = false } = useSearch({ from: '/' })

  return (
    <Group
      justify="space-between"
      px="md"
      py="xs"
      style={{ borderBottom: "1px solid #F1F3F5" }}
    >
      <Text>Data display content</Text>
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

