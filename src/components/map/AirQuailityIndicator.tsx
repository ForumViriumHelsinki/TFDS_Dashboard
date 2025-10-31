import { Box, Center, Paper, Stack, Text } from "@mantine/core";
import { CircleHelp } from "lucide-react";

export function AirQuailityIndicator() {
  return (
    <Paper w={40} h={250} radius={50} shadow="md" px={0} py={8} withBorder={false} pos="absolute" top={80} right={16} style={{zIndex: 400}}>
      <Stack h="100%" gap={10} align="center" justify="space-between">
        <Text fz={12} c="#495057">AQI</Text>
        <Center style={{ flex: 1, width: "100%" }}>
          <Box
            w={24}
            h={177}
            style={{
              borderRadius: 25,
              background:
                "linear-gradient(180deg, #F772D0 0%, #FF3B30 16%, #FF9500 33%, #FFEA00 50%, #7ED957 66%, #2E7D32 83%, #1B5E20 100%)",
            }}
          />
        </Center>
        <CircleHelp size={18} color="#273C80" />
      </Stack>
    </Paper>
  );
}


