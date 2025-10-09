import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../src/App";

describe("App Component", () => {
  it("renders TFDS Dashboard heading", () => {
    render(<App />);
    const heading = screen.getByText(/TFDS Dashboard/i);
    expect(heading).toBeInTheDocument();
  });

  it("displays system status section", () => {
    render(<App />);
    const statusSection = screen.getByText(/System Status/i);
    expect(statusSection).toBeInTheDocument();
  });

  it("shows application running status", () => {
    render(<App />);
    const runningStatus = screen.getByText(/Application Running/i);
    expect(runningStatus).toBeInTheDocument();
  });

  it("shows Sentry monitoring status", () => {
    render(<App />);
    const sentryStatus = screen.getByText(/Sentry Monitoring/i);
    expect(sentryStatus).toBeInTheDocument();
  });

  it("displays map placeholder section", () => {
    render(<App />);
    const mapSection = screen.getByText(/Map Visualization/i);
    expect(mapSection).toBeInTheDocument();
  });

  it("shows footer with version info", () => {
    render(<App />);
    const footer = screen.getByText(/Forum Virium Helsinki/i);
    expect(footer).toBeInTheDocument();
  });
});
