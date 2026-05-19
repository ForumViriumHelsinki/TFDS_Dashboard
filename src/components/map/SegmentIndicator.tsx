import {
  ActionIcon,
  Box,
  Center,
  Paper,
  Popover,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from "@mantine/core";
import { useSearch } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { getSegmentGradientCss } from "../../utils/colors";
import {
  SegmentMeasurementFieldConfig,
  getSegmentMeasurementFieldConfig,
  segmentMeasurementFieldConfigs,
} from "../../constants/segment-fields";

export function SegmentIndicator() {
  const theme = useMantineTheme();
  const { segmentMeasurementField } = useSearch({
    from: "/",
    select: (s) => ({
      segmentMeasurementField: s.segmentMeasurementField,
    }),
  });
  const selectedFieldConfig = getSegmentMeasurementFieldConfig(
    segmentMeasurementField,
  );
  const title = selectedFieldConfig?.label ?? "Segmentit (FCD)";
  const introText = "Väri määräytyy valitun mittarin arvon mukaan.";
  const highValueText = "Sininen = suurempi arvo";
  const lowValueText = "Violetti = pienempi arvo";

  return (
    <Paper
      w={40}
      h={250}
      radius={50}
      shadow="md"
      px={0}
      py="xs"
      withBorder={false}
      pos="absolute"
      top={80}
      right={16}
      style={{ zIndex: 400 }}
    >
      <Stack h="100%" gap={0} align="center">
        <Text size="xs" c={theme.colors.gray[7]}>
          {"FCD"}
        </Text>
        <Center flex={1} w="100%" h={180} p="xs">
          <Box
            h="100%"
            w="100%"
            style={{
              borderRadius: 25,
              background: getSegmentGradientCss(),
            }}
          />
        </Center>
        <Popover
          width={400}
          position="left"
          withArrow
          shadow="md"
          withinPortal
          zIndex={2000}
        >
          <Popover.Target>
            <ActionIcon variant="subtle" radius="xl" aria-label="Segment info">
              <CircleHelp size={18} color={theme.colors.gray[7]} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Title order={5}>{title}</Title>
            <Text size="sm" pb={6}>
              {introText}
            </Text>
            <Text size="sm">{highValueText}</Text>
            <Text size="sm">{lowValueText}</Text>
            <Text size="sm" fw={600} pt={6}>
              Skaalat mittareittain:
            </Text>
            {segmentMeasurementFieldConfigs.map(
              (config: SegmentMeasurementFieldConfig) => (
                <Text size="sm" key={config.label}>
                  {config.label}:{" "}
                  {config.legendRangeLabel ??
                    config.rangeLabel ??
                    `0-${config.yMax}`}
                </Text>
              ),
            )}
          </Popover.Dropdown>
        </Popover>
      </Stack>
    </Paper>
  );
}
