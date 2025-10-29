import "./App.css";
import {
  AppShell,
  Box,
  Button,
  Checkbox,
  Group,
  NavLink,
  ScrollArea,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { Image } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import {
  Calendar,
  ChartLine,
  ChevronDown,
  ChevronRight,
  RefreshCcw,
  X,
} from "lucide-react";
import { useState } from "react";

function App() {
  const [selectedIdeaSegment, setSelectedIdeaSegment] = useState<string | null>(
    ""
  );
  const [dataDisplayOpened, { toggle: toggleDataDisplay }] =
    useDisclosure(false);

  const onSegmentClick = (segment: string) => {
    setSelectedIdeaSegment(segment);
    if (!dataDisplayOpened) {
      toggleDataDisplay();
    }
  };

  return (
    <AppShell
      h="100vh"
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: "sm" }}
    >
      <AppShell.Header px="md" py="sm">
        <Group justify="space-between">
          <Group gap="lg">
            <Image
              src="/images/logos/forumvirium-orange.svg"
              alt="Forum Virium Helsinki"
              w={74}
            />
            <Image
              src="/images/logos/helsinki-black.svg"
              alt="Helsinki"
              w={66}
            />
            <Image
              src="/images/logos/TFDS.svg"
              alt="Traffic and Floating Data Space"
              w={128}
            />
          </Group>
          <Checkbox.Group>
            <Group>
              <Text fw={500}>Ajankohta</Text>
              <DateTimePicker w={200} />
              <Checkbox value="Aluevuokraukset" label="Aluevuokraukset" />
              <Checkbox value="Kaivuilmoitukset" label="Kaivuilmoitukset" />
              <Checkbox value="Ilmanlaatu" label="Ilmanlaatu" />
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
      </AppShell.Header>
      <AppShell.Navbar p={0}>
        <Tabs
          defaultValue="Häiriöt"
          h="100%"
          style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <Tabs.List grow>
            <Tabs.Tab value="Häiriöt">Häiriöt</Tabs.Tab>
            <Tabs.Tab value="Ilmanlaatu">Ilmanlaatu</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel
            value="Häiriöt"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <AppShell.Section
              p="md"
              style={{ borderBottom: "1px solid #F1F3F5" }}
            >
              <TextInput
                size="xs"
                variant="filled"
                label="Haku"
                placeholder="Syötä hakuehto"
                description="Hae tiesegmenttiä "
              />
            </AppShell.Section>
            <AppShell.Section
              grow
              component={ScrollArea}
              mx="-md"
              px="md"
              type="never"
            >
              <NavLink
                href="#required-for-focus"
                label="Tehtaankatu 1-40"
                description="Kaivuilmoitus"
                rightSection={<ChevronRight size={16} />}
                childrenOffset={0}
                defaultOpened
              >
                {Array(60)
                  .fill(0)
                  .map((_, index) => (
                    <NavLink
                      href="#"
                      key={index}
                      onClick={() =>
                        onSegmentClick(`1195756141337706496${index + 1}`)
                      }
                      label={`IDEA Segment ${index + 1}`}
                      description={`1195756141337706496${index + 1}`}
                      leftSection={
                        <ChartLine
                          size={16}
                          color={
                            selectedIdeaSegment ===
                            `1195756141337706496${index + 1}`
                              ? "#F37438"
                              : "#000"
                          }
                        />
                      }
                      active={
                        selectedIdeaSegment ===
                        `1195756141337706496${index + 1}`
                      }
                      style={{
                        borderRight:
                          selectedIdeaSegment ===
                          `1195756141337706496${index + 1}`
                            ? "3px solid #F37438"
                            : "none",
                      }}
                      styles={{
                        label: {
                          color: "black",
                        },
                        description: {
                          color: "#5C5F66",
                        },
                      }}
                    />
                  ))}
              </NavLink>
            </AppShell.Section>
          </Tabs.Panel>

          <Tabs.Panel value="Ilmanlaatu" p="md">
            Ilmanlaatu tab content
          </Tabs.Panel>
        </Tabs>
      </AppShell.Navbar>
      <AppShell.Main h="100%" style={{ overflow: "hidden" }}>
        <Stack gap={0} h="100%" bg="red">
          <Box bg="gray.1" p="md" flex={1} h="100%">
            <Text>Map content</Text>
          </Box>
          <Box bg="white" flex={dataDisplayOpened ? 1 : 0}>
            <Group
              justify="space-between"
              px="md"
              py="xs"
              style={{ borderBottom: "1px solid #F1F3F5" }}
            >
              <Text>Data display content</Text>
              <Button
                size="xs"
                variant="white"
                onClick={toggleDataDisplay}
                color="black"
                leftSection={
                  dataDisplayOpened ? (
                    <X size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )
                }
              >
                {dataDisplayOpened ? "Sulje" : "Näytä"}
              </Button>
            </Group>
            <Group
              h="100%"
              gap={0}
              align="flex-start"
              display={dataDisplayOpened ? "flex" : "none"}
            >
              <Stack
                p="md"
                h="100%"
                gap="xs"
                miw={300}
                style={{ borderRight: "1px solid #F1F3F5" }}
              >
                <Select
                  label="IDEA Segment"
                  placeholder="Valitse IDEA Segment"
                  value={selectedIdeaSegment}
                  size="xs"
                  variant="filled"
                  onChange={setSelectedIdeaSegment}
                  data={Array(60)
                    .fill(0)
                    .map((_, index) => `1195756141337706496${index + 1}`)}
                />
                <DateTimePicker
                  label="Mittausaikaväli"
                  placeholder="Valitse aikaväli"
                  leftSection={<Calendar size={12} />}
                  value={new Date()}
                  size="xs"
                  variant="filled"
                  clearable
                  onChange={() => {}}
                />
                <Select
                  label="Ilmanlaadun mittauspiste"
                  placeholder="Valitse mittauspiste"
                  value="Mittauspiste #1"
                  size="xs"
                  variant="filled"
                  onChange={() => {}}
                  data={[
                    "Mittauspiste #1",
                    "Mittauspiste #2",
                    "Mittauspiste #3",
                  ]}
                />
                <Group gap="xs">
                  <Text fw={500} size="sm">Kaupunginosa:</Text>
                  <Text size="sm">7 ULLANLINNA</Text>
                </Group>
                <Group gap="xs">
                  <Text fw={500} size="sm">Hakemus:</Text>
                  <Text size="sm">7 Kaivuilmoitus</Text>
                </Group>
                <Group gap="xs">
                  <Text fw={500} size="sm">Ajankohta:</Text>
                  <Text size="sm">28.07.2025 - 31.08.2026</Text>
                </Group>
                <Group gap="xs">
                  <Text fw={500} size="sm">Tila:</Text>
                  <Text size="sm">Käynnissä</Text>
                </Group>
              </Stack>
              <Stack flex={1} p="md" h="100%">
                <Text>Data display graphs</Text>
              </Stack>
              <Button
                size="xs"
                variant="white"
                onClick={() => {}}
                color="black"
                leftSection={<RefreshCcw size={12} />}
              >
                Lataa data
              </Button>
            </Group>
          </Box>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
