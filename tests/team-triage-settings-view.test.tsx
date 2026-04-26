import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TeamTriageSettingsPage from "../src/app/(app)/settings/teams/[key]/triage/page";

// Mock useParams
vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG" }),
}));

describe("TeamTriageSettingsPage component", () => {
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
      triageEnabled: true,
    },
  };

  it("renders loading state then triage settings", async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockTeamData,
    });

    render(<TeamTriageSettingsPage />);

    expect(screen.getByText("Loading...")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Triage")).toBeDefined();
    });

    expect(screen.getByText("Enable triage")).toBeDefined();
    const toggle = screen.getByLabelText("Enable triage");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("toggles and persists triage enabled setting", async () => {
    (fetch as any).mockImplementation((url: string, init?: any) => {
      if (init?.method === "PATCH") {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockTeamData,
      });
    });

    render(<TeamTriageSettingsPage />);
    await waitFor(() => screen.getByText("Triage"));

    const toggle = screen.getByLabelText("Enable triage");
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/teams/ENG/settings", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ triageEnabled: false }),
      }));
      expect(screen.getByText("Triage settings updated")).toBeDefined();
    });
  });
});