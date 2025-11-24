import { Checkbox, Group, Image, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Calendar } from "lucide-react";
import { useEffect } from "react";

export function Header() {
  const navigate = useNavigate({ from: '/' })
  const { sources, selectedDate } = useSearch({ from: '/' })
  const setSources = (next: string[]) =>
    navigate({ search: (prev) => ({ ...prev, sources: next }), replace: true })

  // Initialize selectedDate to current time on first load if missing
  useEffect(() => {
    if (!selectedDate) {
      void navigate({
        search: (prev) => ({
          ...prev,
          selectedDate: new Date(),
        }),
        replace: true,
      });
    }
  }, [navigate, selectedDate]);

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
          <Text size="sm" fw={600}>Ajankohta</Text>
          <DateTimePicker
            w={200}
            value={selectedDate ?? null}
            onChange={(value) => {
              void navigate({
                search: (prev) => ({
                  ...prev,
                  selectedDate: value ?? undefined,
                }),
                replace: true,
              });
            }}
            leftSection={<Calendar size={16} />}
            popoverProps={{ withinPortal: true, zIndex: 1200 }}
          />
          <Checkbox value="area-rentals" label="Aluevuokraukset" />
          <Checkbox value="excavation-notices" label="Kaivuilmoitukset" />
          <Checkbox value="air-quality" label="Ilmanlaatu nyt" />
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

