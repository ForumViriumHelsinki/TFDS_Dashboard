import { Checkbox, Group, Image, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AIR_QUALITY_NOW_QUERY_KEY } from "../../hooks/useFilteredAirQuality";

export function Header() {
  const navigate = useNavigate({ from: "/" });
  const queryClient = useQueryClient();
  const { sources, selectedDate } = useSearch({ from: "/" });
  const fallbackDate = useMemo(() => new Date(), []);
  const [showFallback, setShowFallback] = useState(true);
  const displayDate = selectedDate ?? (showFallback ? fallbackDate : null);
  const setSources = (next: string[]) =>
    navigate({ search: (prev) => ({ ...prev, sources: next }), replace: true });

  return (
    <Group justify="space-between">
      <Group gap="lg">
        <Image
          src="/images/logos/forumvirium-orange.svg"
          alt="Forum Virium Helsinki"
          w={74}
        />
        <Image src="/images/logos/helsinki-black.svg" alt="Helsinki" w={66} />
        <Image
          src="/images/logos/TFDS.svg"
          alt="Traffic and Floating Data Space"
          w={128}
        />
      </Group>
      <Checkbox.Group value={sources} onChange={setSources}>
        <Group>
          <Text size="sm" fw={600}>
            Ajankohta
          </Text>
          <DateTimePicker
            clearable
            value={displayDate}
            onChange={(value) => {
              if (!value) {
                // Clear selectedDate in URL, but visually fall back to current time
                setShowFallback(true);
              } else {
                setShowFallback(false);
              }
              void navigate({
                search: (prev) => ({
                  ...prev,
                  selectedDate: value ?? undefined,
                }),
                replace: true,
              });
              if (!value) {
                void queryClient.invalidateQueries({
                  queryKey: AIR_QUALITY_NOW_QUERY_KEY,
                });
              }
            }}
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
