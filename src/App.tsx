import "./App.css";
import { AppShell, Stack } from "@mantine/core";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { MapView } from "./components/map/MapView";
import { DataDisplayPanel } from "./components/data-display/DataDisplayPanel";

function App() {
  return (
    <AppShell
      h="100vh"
      header={{ height: 60 }}
      navbar={{ width: 360, breakpoint: "sm" }}
    >
      <AppShell.Header px="md" py="sm">
        <Header />
      </AppShell.Header>
      <AppShell.Navbar p={0}>
        <Sidebar />
      </AppShell.Navbar>
      <AppShell.Main h="100%" style={{ overflow: "hidden" }}>
        <Stack gap={0} h="100%">
          <MapView />
          <DataDisplayPanel />
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
