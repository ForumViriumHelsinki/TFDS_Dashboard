import { Box, Loader, Stack, Text } from "@mantine/core";

interface LoadingStateProps {
  message: string;
  variant?: "inline" | "overlay";
}

export function LoadingState({ message, variant = "inline" }: LoadingStateProps) {
  if (variant === "overlay") {
    return (
      <Box
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Stack gap="sm" align="center">
          <Loader size="md" />
          <Text size="sm" c="dimmed">
            {message}
          </Text>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack p="md" gap="sm" align="center">
      <Loader size="md" />
      <Text size="sm" c="dimmed">
        {message}
      </Text>
    </Stack>
  );
}
