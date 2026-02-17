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

const SEGMENT_COLORS = {
  top: "#58A7FF",
  upperMid: "#4452E5",
  mid: "#5322B8",
  lowerMid: "#790DA5",
  bottom: "#8B0A7A",
} as const;

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
              background: `linear-gradient(180deg, ${SEGMENT_COLORS.top} 0%, ${SEGMENT_COLORS.upperMid} 25%, ${SEGMENT_COLORS.mid} 50%, ${SEGMENT_COLORS.lowerMid} 75%, ${SEGMENT_COLORS.bottom} 100%)`,
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
            <Text size="sm">
              FCD-indikaattori näyttää segmenttidatan väriskaalalla.
            </Text>
          </Popover.Dropdown>
        </Popover>
      </Stack>
    </Paper>
  );
}
