import { Checkbox, Group, Image, Text } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { AIR_QUALITY_NOW_QUERY_KEY } from "../../hooks/useFilteredAirQuality";
import { useFallbackDate } from "../../hooks/useFallbackDate";
import { floorToFiveMinutes, roundToFiveMinutes } from "../../utils/time";

function toDateOrNull(value: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function Header() {
  const navigate = useNavigate({ from: "/" });
  const queryClient = useQueryClient();
  const { sources, selectedDate } = useSearch({ from: "/" });
  const fallbackDateRaw = useFallbackDate(Boolean(!selectedDate), 300_000);
  const fallbackDateTs = floorToFiveMinutes(fallbackDateRaw).getTime();
  const displayTs = selectedDate?.getTime() ?? fallbackDateTs;
  const displayDate = new Date(displayTs);
  const draftDateRef = useRef<Date | null>(displayDate);
  const hasPendingUserChangeRef = useRef(false);
  const setSources = (next: string[]) =>
    navigate({ search: (prev) => ({ ...prev, sources: next }), replace: true });

  const commitSelectedDate = (value: Date | null) => {
    if (!hasPendingUserChangeRef.current) return;
    hasPendingUserChangeRef.current = false;

    if (!value) {
      void navigate({
        search: (prev) => ({
          ...prev,
          // Clear selectedDate in URL, but visually fall back to current time
          selectedDate: undefined,
        }),
        replace: true,
      });
      void queryClient.invalidateQueries({
        queryKey: AIR_QUALITY_NOW_QUERY_KEY,
      });
      return;
    }

    const snappedValue = roundToFiveMinutes(value);
    void navigate({
      search: (prev) => ({
        ...prev,
        selectedDate: snappedValue,
      }),
      replace: true,
    });
  };

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
            key={`header-datetime-${selectedDate ? "manual" : "auto"}-${displayTs}`}
            clearable
            defaultValue={displayDate}
            timePickerProps={{ minutesStep: 5 }}
            onChange={(value) => {
              hasPendingUserChangeRef.current = true;
              const next = toDateOrNull(value);
              draftDateRef.current = next;
              if (!next) {
                commitSelectedDate(null);
              }
            }}
            onBlur={() => commitSelectedDate(draftDateRef.current)}
            onDropdownClose={() => commitSelectedDate(draftDateRef.current)}
            maxDate={new Date()}
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
