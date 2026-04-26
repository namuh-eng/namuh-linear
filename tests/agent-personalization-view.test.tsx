import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({}),
}));

import AgentPersonalizationPage from "@/app/(app)/settings/account/agents/page";

describe("AgentPersonalizationPage UI", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the agent personalization page correctly", () => {
    render(<AgentPersonalizationPage />);

    expect(screen.getByText("Agent personalization")).toBeInTheDocument();
    expect(
      screen.getByText(/Configure the coding and agent assistance defaults/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Coding tools")).toBeInTheDocument();
  });
});
