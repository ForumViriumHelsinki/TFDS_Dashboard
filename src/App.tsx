import "./App.css";
import { AppShell, Group } from '@mantine/core';

function App() {
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 300, breakpoint: 'sm' }}>
      <AppShell.Header>
        <Group h="100%" px="md">
          Logos left
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        Navbar left
      </AppShell.Navbar>
      <AppShell.Main>
        Main content
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
