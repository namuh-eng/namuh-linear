import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeamWorkflowsSettingsPage from "../src/app/(app)/settings/teams/[key]/workflows/page";

// Mock useParams
vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG" }),
}));

describe("TeamWorkflowsSettingsPage component", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  const mockTeamData = {
    team: {
      name: "Engineering",
      detailedHistory: false,
    },
  };

  it("renders loading state then workflow settings", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTeamData,
    });

    render(<TeamWorkflowsSettingsPage />);

    expect(screen.getByText("Loading...")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Workflows & automations")).toBeDefined();
    });

    expect(screen.getByText("Enable detailed issue history")).toBeDefined();
    const toggle = screen.getByLabelText("Enable detailed issue history");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("toggles and persists detailed history setting", async () => {
    (fetch as any).mockImplementation((url: string, init?: any) => {
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockTeamData,
      });
    });

    render(<TeamWorkflowsSettingsPage />);
    await waitFor(() => screen.getByText("Workflows & automations"));

    const toggle = screen.getByLabelText("Enable detailed issue history");
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/teams/ENG/settings", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ detailedHistory: true }),
      }));
      expect(screen.getByText("Workflow settings updated")).toBeDefined();
    });
  });
});