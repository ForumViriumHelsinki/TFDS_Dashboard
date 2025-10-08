import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sentryEnabled = !!import.meta.env.VITE_SENTRY_DSN;
  const appVersion = import.meta.env.VITE_APP_VERSION || "0.1.0";

  return (
    <div className="App">
      <header>
        <h1>TFDS Dashboard</h1>
        <p>Traffic and Floating Data System Visualization</p>
      </header>

      <main>
        <section className="status">
          <h2>System Status</h2>
          <ul>
            <li className="status-ok">✓ Application Running</li>
            <li className="status-time">
              ⏱ Current Time: {currentTime.toISOString()}
            </li>
            <li className={sentryEnabled ? "status-ok" : "status-pending"}>
              {sentryEnabled ? "✓" : "?"} Sentry Monitoring{" "}
              {sentryEnabled ? "(Active)" : "(Not Configured)"}
            </li>
            <li className="status-pending">? InfluxDB (Not Configured)</li>
          </ul>
        </section>

        <section className="map-placeholder">
          <h2>Map Visualization</h2>
          <div className="map-container">
            <p>Map component will be rendered here</p>
            <p>Data Source: InfluxDB Time-Series Database</p>
          </div>
        </section>
      </main>

      <footer>
        <p>
          Forum Virium Helsinki | Version: {appVersion}
          {sentryEnabled && " | Monitoring: Active"}
        </p>
      </footer>
    </div>
  );
}

export default App;
