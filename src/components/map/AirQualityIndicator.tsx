import {
  ActionIcon,
  Box,
  Center,
  Paper,
  Popover,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { CircleHelp } from "lucide-react";
import { AIR_QUALITY_COLORS } from "../../utils/airQuality";

export function AirQualityIndicator() {
  return (
    <Paper
      w={40}
      h={250}
      radius={50}
      shadow="md"
      px={0}
      py={8}
      withBorder={false}
      pos="absolute"
      top={80}
      right={16}
      style={{ zIndex: 400 }}
    >
      <Stack h="100%" gap={10} align="center" justify="space-between">
        <Text fz={12} c="#495057">
          AQI
        </Text>
        <Center style={{ flex: 1, width: "100%" }}>
          <Box
            w={24}
            h={177}
            style={{
              borderRadius: 25,
              background:
                `linear-gradient(180deg, ${AIR_QUALITY_COLORS["Good air quality"]} 0%, ${AIR_QUALITY_COLORS["Satisfactory air quality"]} 25%, ${AIR_QUALITY_COLORS["Fair air quality"]} 50%, ${AIR_QUALITY_COLORS["Poor air quality"]} 75%, ${AIR_QUALITY_COLORS["Very poor air quality"]} 100%)`,
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
            <ActionIcon
              variant="white"
              radius="xl"
              size={18}
              aria-label="AQI info"
            >
              <CircleHelp size={18} color="#273C80" />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Title order={5}>Ilmanlaadun värikoodit</Title>
            <Text size="sm" pb="xs">HSY käyttää seuraavia värejä ilmanlaadun indikaattorina:</Text>
            <Text size="sm">Vihreä - Hyvä (Ilmanlaatuindeksi 0 - 50)</Text>
            <Text size="sm">Keltainen - Tyydyttävä (Ilmanlaatuindeksi 51 - 75)</Text>
            <Text size="sm">Oranssi - Välttävä (Ilmanlaatuindeksi 76 - 100)</Text>
            <Text size="sm">Punainen - Huono (Ilmanlaatuindeksi 101 - 150)</Text>
            <Text size="sm">Violetti - Erittäin huono (Ilmanlaatuindeksi 151 - )</Text>
          </Popover.Dropdown>
        </Popover>
      </Stack>
    </Paper>
  );
}
