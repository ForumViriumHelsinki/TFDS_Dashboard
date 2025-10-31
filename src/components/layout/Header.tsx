import { Checkbox, Group, Image, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useAtom } from "jotai";
import { selectedDataSourcesAtom } from "../../atoms/filters";

export function Header() {
  const [selectedDataSources, setSelectedDataSources] = useAtom(selectedDataSourcesAtom);

  return (
    <Group justify="space-between">
      <Group gap="lg">
        <Image
          src="/images/logos/forumvirium-orange.svg"
          alt="Forum Virium Helsinki"
          w={74}
        />
        <Image
          src="/images/logos/helsinki-black.svg"
          alt="Helsinki"
          w={66}
        />
        <Image
          src="/images/logos/TFDS.svg"
          alt="Traffic and Floating Data Space"
          w={128}
        />
      </Group>
      <Checkbox.Group value={selectedDataSources} onChange={setSelectedDataSources}>
        <Group>
          <Text size="xs" fw={500}>Ajankohta</Text>
          <DateTimePicker 
            w={200} 
            value={new Date("2025-07-28")} 
          />
          <Checkbox value="Aluevuokraukset" label="Aluevuokraukset" />
          <Checkbox value="Kaivuilmoitukset" label="Kaivuilmoitukset" />
          <Checkbox value="Ilmanlaatu" label="Ilmanlaatu" />
        </Group>
      </Checkbox.Group>
      <Group gap="lg">
        <Image
          src="/images/logos/edpsm.webp"
          alt="European data space for smart communities"
          w={128}
        />
        <Image
          src="/images/logos/co-fundedbytheEU.png"
          alt="Co-funded by the EU"
          w={144}
        />
      </Group>
    </Group>
  );
}

