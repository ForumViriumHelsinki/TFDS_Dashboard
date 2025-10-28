import "./App.css";
import { AppShell, Checkbox, Group, Tabs, Text } from '@mantine/core';
import { Image } from '@mantine/core';
import { DateTimePicker } from "@mantine/dates";

function App() {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: 'sm' }}>
      <AppShell.Header px="md" py="sm">
        <Group justify="space-between">
          <Group gap="lg">
            <Image src="/images/logos/forumvirium-orange.svg" alt="Forum Virium Helsinki" w={74} />
            <Image src="/images/logos/helsinki-black.svg" alt="Helsinki" w={66} />
            <Image src="/images/logos/TFDS.svg" alt="Traffic and Floating Data Space" w={128} />
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
            <Image src="/images/logos/edpsm.webp" alt="European data space for smart communities" w={128} />
            <Image src="/images/logos/co-fundedbytheEU.png" alt="Co-funded by the EU" w={144} />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p={0}>
      <Tabs defaultValue="Häiriöt">
      <Tabs.List>
        <Tabs.Tab value="Häiriöt" flex={1}>
          Häiriöt
        </Tabs.Tab>
        <Tabs.Tab value="Ilmanlaatu" flex={1}>
          Ilmanlaatu
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="Häiriöt" p="md">
        Häiriöt tab content
      </Tabs.Panel>

      <Tabs.Panel value="Ilmanlaatu" p="md">
        Ilmanlaatu tab content
      </Tabs.Panel>
    </Tabs>
      </AppShell.Navbar>
      <AppShell.Main>
        Main content
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
