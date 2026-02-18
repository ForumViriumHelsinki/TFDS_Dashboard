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
import { getAirQualityGradientCss } from "../../utils/colors";

export function AirQualityIndicator() {
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
        <Text size="xs" c={theme.colors.gray[7]}>
          AQI
        </Text>
        <Center flex={1} w="100%" h={180} p="xs">
          <Box
            h="100%"
            w="100%"
            style={{
              borderRadius: 25,
              background: getAirQualityGradientCss(),
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
            <ActionIcon variant="white" radius="xl" aria-label="AQI info">
              <CircleHelp size={18} color={theme.colors.gray[7]} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Title order={5}>Ilmanlaadun värikoodit</Title>
            <Text size="sm" pb="xs">
              HSY käyttää seuraavia värejä ilmanlaadun indikaattorina:
            </Text>
            <Text size="sm">Vihreä - Hyvä (Ilmanlaatuindeksi 0 - 50)</Text>
            <Text size="sm">
              Keltainen - Tyydyttävä (Ilmanlaatuindeksi 51 - 75)
            </Text>
            <Text size="sm">
              Oranssi - Välttävä (Ilmanlaatuindeksi 76 - 100)
            </Text>
            <Text size="sm">
              Punainen - Huono (Ilmanlaatuindeksi 101 - 150)
            </Text>
            <Text size="sm">
              Violetti - Erittäin huono (Ilmanlaatuindeksi 151 - )
            </Text>
          </Popover.Dropdown>
        </Popover>
      </Stack>
    </Paper>
  );
}
