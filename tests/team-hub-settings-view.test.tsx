import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockTeam = {
  name: "Engineering",
  key: "ENG",
  icon: "🚀",
  memberCount: 5,
  labelCount: 10,
  statusCount: 6,
  triageEnabled: true,
  cyclesEnabled: true,
};

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG" }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("TeamSettingsHubPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then team hub details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ team: mockTeam }),
    }));

    render(<TeamSettingsHubPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("5 members")).toBeInTheDocument();
    expect(screen.getByText("10 labels")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument(); // Triage
  });

  it("opens leave team dialog and confirms", async () => {
    const fetchMock = vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ team: mockTeam }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Left team", redirectTo: "/settings/teams" }),
      })
    );

    render(<TeamSettingsHubPage />);
    await waitFor(() => screen.getByText("Engineering"));

    fireEvent.click(screen.getByText("Leave team"));
    expect(screen.getByText("Leave team?")).toBeInTheDocument();

    const confirmButton = screen.getAllByRole("button", { name: "Leave team" }).find(
      btn => btn.closest("dialog")
    );
    if (!confirmButton) throw new Error("Confirm button not found in dialog");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/teams/ENG/settings", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"action":"leave"'),
      }));
    });
  });
});

import TeamSettingsHubPage from "@/app/(app)/settings/teams/[key]/page";
