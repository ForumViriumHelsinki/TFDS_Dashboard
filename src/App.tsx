import "./App.css";
import {
  AppShell,
  Box,
  Button,
  Checkbox,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { Image } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { ChartLine, ChevronDown, X } from "lucide-react";

function App() {
  const [dataDisplayOpened, { toggle: toggleDataDisplay }] =
    useDisclosure(false);

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
        <Tabs defaultValue="Häiriöt">
          <Tabs.List grow>
            <Tabs.Tab value="Häiriöt">Häiriöt</Tabs.Tab>
            <Tabs.Tab value="Ilmanlaatu">Ilmanlaatu</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="Häiriöt">
            <AppShell.Section
              p="md"
              style={{ borderBottom: "1px solid #e0e0e0" }}
            >
              <TextInput
                label="Haku"
                placeholder="Syötä hakuehto"
                description="Hae tiesegmenttiä "
              />
            </AppShell.Section>
            <AppShell.Section grow component={ScrollArea}>
              {Array(60)
                .fill(0)
                .map((_, index) => (
                  <NavLink
                    href="#"
                    key={index}
                    onClick={(event) => event.preventDefault()}
                    label={`IDEA Segment ${index + 1}`}
                    description={`1195756141337706496${index + 1}`}
                    leftSection={<ChartLine size={16} />}
                  />
                ))}
            </AppShell.Section>
            <AppShell.Section p="md">
              Navbar footer – always at the bottom
            </AppShell.Section>
          </Tabs.Panel>

          <Tabs.Panel value="Ilmanlaatu" p="md">
            Ilmanlaatu tab content
          </Tabs.Panel>
        </Tabs>
      </AppShell.Navbar>
      <AppShell.Main h="100%">
        <Stack gap={0} h="100%" bg="red">
          <Box bg="gray.1" p="md" flex={1} h="100%">
            <Text>Map content</Text>
          </Box>
          <Box bg="white" p="md" flex={dataDisplayOpened ? 1 : 0} h="100%">
            <Group justify="space-between">
              <Text>Data display content</Text>
              <Button size="xs" variant="white" onClick={toggleDataDisplay} color="black" leftSection={dataDisplayOpened ? <X size={16} /> : <ChevronDown size={16} />}>
                {dataDisplayOpened ? "Sulje" : "Näytä"}
              </Button>
            </Group>
          </Box>
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
