import { Button, Group, Text } from "@mantine/core";
import { ChevronDown, X } from "lucide-react";
import { useAtom } from "jotai";
import { dataDisplayOpenedAtom } from "../../atoms/dataDisplay";

export function DataDisplayHeader() {
  const [dataDisplayOpened, setDataDisplayOpened] = useAtom(dataDisplayOpenedAtom);

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
        onClick={() => setDataDisplayOpened(!dataDisplayOpened)}
        color="black"
        leftSection={
          dataDisplayOpened ? (
            <X size={16} />
          ) : (
            <ChevronDown size={16} />
          )
        }
      >
        {dataDisplayOpened ? "Sulje" : "Näytä"}
      </Button>
    </Group>
  );
}

