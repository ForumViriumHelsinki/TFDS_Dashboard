import {
  Button,
  Group,
  Popover,
  Select,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { ExternalLink } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { getAirQualityStationId } from "../../utils/airQuality";
import {
  AirQualityTypes,
  getListAirQualityQueryOptions,
} from "../../queries/air-quality";
import { useQuery } from "@tanstack/react-query";
import { buildSegmentsFeatureCollection } from "../../utils/invertTrafficDisturbances";
import { useEffect, useMemo } from "react";
import { useMergedDisturbances } from "../../hooks/useMergedDisturbances";

const DEFAULT_END_DATE = new Date();
const DEFAULT_START_DATE = new Date(
  DEFAULT_END_DATE.getTime() - 12 * 60 * 60 * 1000,
);

interface PropertyDisplayItemProps {
  label: string;
  value: string | undefined;
  hasData: boolean;
}

function PropertyDisplayItem({
  label,
  value,
  hasData,
}: PropertyDisplayItemProps) {
  return (
    <Group gap="xs">
      <Text fw={600} size="sm">
        {label}:
      </Text>
      <Text size="sm" c={hasData ? "black" : "dimmed"}>
        {value ?? "Ei dataa"}
      </Text>
    </Group>
  );
}

interface DataSourceButtonProps {
  label: string;
  url: string;
}

function DataSourceButton({ label, url }: DataSourceButtonProps) {
  const theme = useMantineTheme();

  return (
    <Button
      size="sm"
      variant="subtle"
      color="black"
      fullWidth
      rightSection={<ExternalLink size={14} color={theme.colors.gray[6]} />}
      onClick={() => window.open(url, "_blank")}
    >
      {label}
    </Button>
  );
}

export function DataDisplaySidebar() {
  const theme = useMantineTheme();
  const navigate = useNavigate({ from: "/" });
  const {
    selectedSegment,
    selectedAirQualityStation,
    selectedStartDate,
    selectedEndDate,
  } = useSearch({ from: "/" });
  const { isPending: isPendingAirQuality, data: airQualityData } = useQuery(
    getListAirQualityQueryOptions({
      airQualityType: AirQualityTypes.AIR_QUALITY_NOW,
    }),
  );

  const { map, getSelectedGroupBySegment, isLoading } = useMergedDisturbances();

  const trafficSegmentsFC = useMemo(() => {
    return buildSegmentsFeatureCollection(map);
  }, [map]);

  const selectedGroup = useMemo(
    () => getSelectedGroupBySegment(selectedSegment),
    [getSelectedGroupBySegment, selectedSegment],
  );

  // If selected segment is not found (e.g. filtered out), clear it
  useEffect(() => {
    if (!isLoading && selectedSegment && !selectedGroup) {
      navigate({
        search: (prev) => ({ ...prev, selectedSegment: undefined }),
        replace: true,
      });
    }
  }, [isLoading, selectedSegment, selectedGroup, navigate]);

  // Initialize URL search params with defaults on first load if missing
  useEffect(() => {
    if (!selectedStartDate || !selectedEndDate) {
      navigate({
        search: (prev) => ({
          ...prev,
          selectedStartDate: selectedStartDate ?? DEFAULT_START_DATE,
          selectedEndDate: selectedEndDate ?? DEFAULT_END_DATE,
        }),
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack
      p="md"
      h="100%"
      gap="xs"
      miw={300}
      style={{ borderRight: `1px solid ${theme.colors.gray[3]}` }}
    >
      <Select
        label="IDEA Segment"
        placeholder="Valitse IDEA Segment"
        value={selectedSegment}
        size="sm"
        variant="filled"
        onChange={(value) =>
          navigate({
            search: (prev) => ({ ...prev, selectedSegment: value }),
            replace: true,
          })
        }
        data={(trafficSegmentsFC.features ?? []).map((feature) => {
          return {
            value: feature.properties?.segmentId ?? "",
            label: feature.properties?.segmentId ?? "",
          };
        })}
        clearable
        onClear={() =>
          navigate({
            search: (prev) => ({ ...prev, selectedSegment: "" }),
            replace: true,
          })
        }
      />
      <DateTimePicker
        label="Mittausaikaväli alkaen"
        placeholder="Valitse alkuhetki"
        value={selectedStartDate ?? null}
        onChange={(value) => {
          void navigate({
            search: (prev) => ({
              ...prev,
              selectedStartDate: value ?? DEFAULT_START_DATE,
            }),
            replace: true,
          });
        }}
        size="sm"
        variant="filled"
        maxDate={new Date()}
      />
      <DateTimePicker
        label="Mittausaikaväli päättyen"
        placeholder="Valitse loppuhetki"
        value={selectedEndDate ?? null}
        onChange={(value) => {
          void navigate({
            search: (prev) => ({
              ...prev,
              selectedEndDate: value ?? DEFAULT_END_DATE,
            }),
            replace: true,
          });
        }}
        size="sm"
        variant="filled"
        maxDate={new Date()}
      />
      <Select
        label="Ilmanlaadun mittauspiste"
        placeholder="Valitse mittauspiste"
        disabled={isPendingAirQuality}
        value={selectedAirQualityStation ?? null}
        size="sm"
        variant="filled"
        onChange={(value) =>
          navigate({
            search: (prev) => ({
              ...prev,
              selectedAirQualityStation: value ?? undefined,
            }),
            replace: true,
          })
        }
        data={(airQualityData?.features ?? []).map((feature) => {
          const properties = feature.properties ?? {};
          const id = getAirQualityStationId(feature);
          return { value: id, label: properties.Mittausasema ?? "" };
        })}
      />
      <PropertyDisplayItem
        label="Kaupunginosa"
        value={selectedGroup?.landLeaseProperties?.kaupunginosa}
        hasData={!!selectedGroup}
      />
      <PropertyDisplayItem
        label="Hakemus"
        value={selectedGroup?.landLeaseProperties?.hakemustunnus}
        hasData={!!selectedGroup}
      />
      <PropertyDisplayItem
        label="Ajankohta"
        value={selectedGroup?.landLeaseProperties?.tyo_alkaa_txt}
        hasData={!!selectedGroup}
      />
      <PropertyDisplayItem
        label="Tila"
        value={selectedGroup?.landLeaseProperties?.status}
        hasData={!!selectedGroup}
      />
      <Popover width={268} shadow="sm" withinPortal zIndex={1200}>
        <Popover.Target>
          <Button
            variant="outline"
            color="black"
            size="sm"
            rightSection={<ExternalLink size={12} />}
          >
            Alkuperäisdata
          </Button>
        </Popover.Target>
        <Popover.Dropdown p={0} py="xs">
          <Stack gap="xs">
            <DataSourceButton
              label="Kaivuilmoitukset"
              url="https://kartta.hel.fi/ws/geoserver/avoindata/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=Kaivuilmoitus_alue&outputFormat=application/json&SRSNAME=urn:ogc:def:crs:EPSG:4326"
            />
            <DataSourceButton
              label="Aluevuokraukset"
              url="https://kartta.hel.fi/ws/geoserver/avoindata/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=Aluevuokraus_alue&outputFormat=application/json&SRSNAME=urn:ogc:def:crs:EPSG:4326"
            />
            <DataSourceButton
              label="Ilmanlaatu nyt"
              url="https://kartta.hsy.fi/geoserver/wfs?version=2.0.0&request=GetFeature&typeNames=Ilmanlaatu_nyt&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326"
            />
            <DataSourceButton
              label="Ilmanlaatu max 24h"
              url="https://kartta.hsy.fi/geoserver/wfs?version=2.0.0&request=GetFeature&typeNames=Ilmanlaatu_24h_maksimiarvo&count=10000&outputFormat=application/json&srsName=urn:ogc:def:crs:EPSG::4326"
            />
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Stack>
  );
}
