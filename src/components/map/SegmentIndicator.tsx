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
import { CircleHelp } from "lucide-react";
import { getSegmentGradientCss } from "../../utils/segmentColors";
import { SegmentMeasurementFieldConfig, segmentMeasurementFieldConfigs } from "../../constants/segment-fields";

export function SegmentIndicator() {
  const theme = useMantineTheme();

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
        <Text
          size="xs"
          c={theme.colors.gray[7]}
          style={{ fontFamily: "Montserrat, sans-serif", lineHeight: 1.55 }}
        >
          FCD
        </Text>
        <Center flex={1} w="100%" h={180} p="xs">
          <Box
            h="100%"
            w={24}
            style={{
              borderRadius: 25,
              background: getSegmentGradientCss(),
            }}
          />
        </Center>
        <Popover
          width={360}
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
            <Title order={5}>Segmentit (FCD)</Title>
            <Text size="sm" pb={6}>
              Väri määräytyy valitun mittarin arvon mukaan.
            </Text>
            <Text size="sm">Sininen = suurempi arvo</Text>
            <Text size="sm" pb={6}>Violetti = pienempi arvo</Text>
            <Text size="sm" fw={600}>Skaalat mittareittain:</Text>
            {segmentMeasurementFieldConfigs.map((config: SegmentMeasurementFieldConfig) => (
              <Text size="sm" key={config.label}>
                {config.label}: 0-{config.yMax}
              </Text>
            ))}
          </Popover.Dropdown>
        </Popover>
      </Stack>
    </Paper>
  );
}
