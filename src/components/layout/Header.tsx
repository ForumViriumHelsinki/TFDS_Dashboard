import { Checkbox, Group, Image, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useNavigate, useSearch } from '@tanstack/react-router'

export function Header() {
  const navigate = useNavigate({ from: '/' })
  const { sources } = useSearch({ from: '/' })
  const setSources = (next: string[]) =>
    navigate({ search: (p) => ({ ...p, sources: next }), replace: true })

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
      <Checkbox.Group value={sources} onChange={setSources}>
        <Group>
          <Text size="xs" fw={500}>Ajankohta</Text>
          <DateTimePicker 
            w={200} 
            value={new Date("2025-07-28")} 
          />
          <Checkbox value="area-rentals" label="Aluevuokraukset" />
          <Checkbox value="excavation-notices" label="Kaivuilmoitukset" />
          <Checkbox value="air-quality" label="Ilmanlaatu" />
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

