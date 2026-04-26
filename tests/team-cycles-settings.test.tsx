import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamGeneralSettingsPage from "@/app/(app)/settings/teams/[key]/general/page";
import { useParams, useRouter } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn(),
}));

describe("TeamGeneralSettingsPage - Cycles Integration", () => {
  const pushMock = vi.fn();
  const replaceMock = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const mockTeam = {
    team: {
      id: "t-1",
      name: "Engineering",
      key: "ENG",
      icon: "🔧",
      timezone: "Asia/Seoul",
      estimateType: "linear",
      triageEnabled: true,
      cyclesEnabled: true,
      cycleStartDay: 1,
      cycleDurationWeeks: 2,
      memberCount: 5,
      labelCount: 10,
      statusCount: 8,
      emailEnabled: false,
      detailedHistory: true,
    },
  };

  it("renders cycle settings correctly when cycles are enabled", async () => {
    vi.mocked(useParams).mockReturnValue({ key: "ENG" });
    vi.mocked(useRouter).mockReturnValue({ push: pushMock, replace: replaceMock } as any);
    
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTeam),
    }));

    render(<TeamGeneralSettingsPage />);

    await waitFor(() => expect(screen.getByDisplayValue("Engineering")).toBeInTheDocument());

    // Check Cycles section
    expect(screen.getByText("Cycles")).toBeInTheDocument();
    const cycleSwitch = screen.getByRole("switch", { name: "Enable cycles" });
    expect(cycleSwitch).toHaveAttribute("aria-checked", "true");

    const startDaySelect = screen.getByLabelText("Cycle start day");
    const durationSelect = screen.getByLabelText("Cycle duration");

    expect(startDaySelect).not.toBeDisabled();
    expect(durationSelect).not.toBeDisabled();
    expect(startDaySelect).toHaveValue("1"); // Monday
    expect(durationSelect).toHaveValue("2"); // 2 weeks
  });

  it("disables cycle controls when cycles are toggled off", async () => {
    vi.mocked(useParams).mockReturnValue({ key: "ENG" });
    vi.mocked(useRouter).mockReturnValue({ push: pushMock, replace: replaceMock } as any);
    
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        team: { ...mockTeam.team, cyclesEnabled: false }
      }),
    }));

    render(<TeamGeneralSettingsPage />);

    await waitFor(() => expect(screen.getByDisplayValue("Engineering")).toBeInTheDocument());

    const cycleSwitch = screen.getByRole("switch", { name: "Enable cycles" });
    expect(cycleSwitch).toHaveAttribute("aria-checked", "false");

    expect(screen.getByLabelText("Cycle start day")).toBeDisabled();
    expect(screen.getByLabelText("Cycle duration")).toBeDisabled();

    // Toggle them on
    fireEvent.click(cycleSwitch);
    expect(cycleSwitch).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Cycle start day")).not.toBeDisabled();
    expect(screen.getByLabelText("Cycle duration")).not.toBeDisabled();
  });

  it("persists cycle setting changes via PATCH API", async () => {
    vi.mocked(useParams).mockReturnValue({ key: "ENG" });
    vi.mocked(useRouter).mockReturnValue({ push: pushMock, replace: replaceMock } as any);
    
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          team: {
            ...mockTeam.team,
            cycleStartDay: 2,
            cycleDurationWeeks: 4,
          }
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<TeamGeneralSettingsPage />);

    await waitFor(() => expect(screen.getByDisplayValue("Engineering")).toBeInTheDocument());

    // Change start day and duration
    fireEvent.change(screen.getByLabelText("Cycle start day"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Cycle duration"), { target: { value: "4" } });

    // Save
    fireEvent.click(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/teams/ENG/settings", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"cycleStartDay":2'),
      }));
      expect(fetchMock).toHaveBeenCalledWith("/api/teams/ENG/settings", expect.objectContaining({
        body: expect.stringContaining('"cycleDurationWeeks":4'),
      }));
    });

    expect(screen.getByText("Changes saved")).toBeInTheDocument();
  });
});
