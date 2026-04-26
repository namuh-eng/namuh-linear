import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockTeamGeneral = {
  name: "Engineering",
  key: "ENG",
  icon: "🚀",
  timezone: "America/Los_Angeles",
  estimateType: "linear",
  emailEnabled: true,
  detailedHistory: false,
  cyclesEnabled: true,
  cycleStartDay: 1,
  cycleDurationWeeks: 2,
};

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG" }),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

describe("TeamGeneralSettingsPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then team details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ team: mockTeamGeneral }),
    }));

    render(<TeamGeneralSettingsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Engineering")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ENG")).toBeInTheDocument();
  });

  it("updates team name and saves changes", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ team: mockTeamGeneral }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ team: { ...mockTeamGeneral, name: "Platform" } }),
      })
    );

    render(<TeamGeneralSettingsPage />);
    await waitFor(() => screen.getByDisplayValue("Engineering"));

    const nameInput = screen.getByDisplayValue("Engineering");
    fireEvent.change(nameInput, { target: { value: "Platform" } });

    fireEvent.click(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/teams/ENG/settings", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"name":"Platform"'),
      }));
    });

    expect(screen.getByText("Changes saved")).toBeInTheDocument();
  });

  it("toggles cycles and updates start day", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ team: mockTeamGeneral }),
    }));

    render(<TeamGeneralSettingsPage />);
    await waitFor(() => screen.getByLabelText("Enable cycles"));

    const toggle = screen.getByLabelText("Enable cycles");
    // It's enabled in mock
    expect(toggle).toHaveAttribute("aria-checked", "true");

    const startDaySelect = screen.getByLabelText("Cycle start day");
    fireEvent.change(startDaySelect, { target: { value: "2" } }); // Tuesday
    expect(startDaySelect).toHaveValue("2");
  });
});

import TeamGeneralSettingsPage from "@/app/(app)/settings/teams/[key]/general/page";
