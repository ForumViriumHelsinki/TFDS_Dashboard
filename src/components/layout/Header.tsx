import { Checkbox, Group, Image, Text } from "@mantine/core";
import { UserMenu } from "../auth/UserMenu";
import { DateTimePicker } from "@mantine/dates";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { AIR_QUALITY_NOW_QUERY_KEY } from "../../hooks/useFilteredAirQuality";
import {
  getDefaultDateRange,
  roundToFiveMinutes,
  toDateOrNull,
} from "../../utils/time";

export function Header() {
  const navigate = useNavigate({ from: "/" });
  const queryClient = useQueryClient();
  const { sources, selectedDate, selectedDateMode } = useSearch({ from: "/" });
  const defaultRange = getDefaultDateRange();
  const displayTs = selectedDate?.getTime() ?? defaultRange.end.getTime();
  const displayDate = new Date(displayTs);
  const draftDateRef = useRef<Date | null>(displayDate);
  const hasPendingUserChangeRef = useRef(false);
  const setSources = (next: string[]) =>
    navigate({ search: (prev) => ({ ...prev, sources: next }), replace: true });

  const commitSelectedDate = (value: Date | null) => {
    if (!hasPendingUserChangeRef.current) return;
    hasPendingUserChangeRef.current = false;

    if (!value) {
      const { start, end } = getDefaultDateRange();
      void navigate({
        search: (prev) => ({
          ...prev,
          selectedDate: end,
          selectedStartDate: start,
          selectedEndDate: end,
          selectedDateMode: "live",
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
        selectedDateMode: "manual",
      }),
      replace: true,
    });
  };

  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="sm" wrap="nowrap">
        <Image
          src="/images/logos/forumvirium-orange.svg"
          alt="Forum Virium Helsinki"
          w={56}
        />
        <Image src="/images/logos/helsinki-black.svg" alt="Helsinki" w={50} />
        <Image
          src="/images/logos/TFDS.svg"
          alt="Traffic and Floating Data Space"
          w={100}
        />
      </Group>
      <Checkbox.Group value={sources} onChange={setSources}>
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={600}>
            Ajankohta
          </Text>
          <DateTimePicker
            key={`header-datetime-${selectedDateMode ?? "live"}-${displayTs}`}
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
      <Group gap="sm" wrap="nowrap">
        <Image
          src="/images/logos/edpsm.webp"
          alt="European data space for smart communities"
          w={80}
        />
        <Image
          src="/images/logos/co-fundedbytheEU.png"
          alt="Co-funded by the EU"
          w={96}
        />
        <UserMenu />
      </Group>
    </Group>
  );
}
