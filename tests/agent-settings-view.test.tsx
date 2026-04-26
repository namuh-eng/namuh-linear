import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG", section: "agents" }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import AgentPersonalizationPage from "@/app/(app)/settings/account/agents/page";
import TeamSettingsPlaceholderPage from "@/app/(app)/settings/teams/[key]/[section]/page";

describe("AgentPersonalizationPage component", () => {
  afterEach(cleanup);

  it("renders agent personalization content", () => {
    render(<AgentPersonalizationPage />);
    expect(screen.getByText("Agent personalization")).toBeInTheDocument();
    expect(screen.getByText(/Configure the coding/)).toBeInTheDocument();
    expect(screen.getByText("Coding tools")).toBeInTheDocument();
  });
});

describe("TeamSettingsPlaceholderPage component", () => {
  afterEach(cleanup);

  it("renders correct team section content for 'agents'", () => {
    render(<TeamSettingsPlaceholderPage />);
    expect(screen.getByText("Agents")).toBeInTheDocument();
    expect(screen.getByText(/Manage AI agent guidance/)).toBeInTheDocument();
    expect(screen.getByText("Back to team settings")).toBeInTheDocument();
  });
});
