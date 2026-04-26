import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
  useParams: () => ({ key: "ENG" }),
}));

import TeamSettingsHubPage from "@/app/(app)/settings/teams/[key]/page";

const mockTeamHubData = {
  team: {
    name: "Engineering",
    key: "ENG",
    icon: "🚀",
    memberCount: 5,
    labelCount: 10,
    statusCount: 6,
    triageEnabled: true,
    cyclesEnabled: false,
  },
};

describe("TeamSettingsHubPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders loading state then team settings cards", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockTeamHubData,
    } as Response);

    render(<TeamSettingsHubPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    expect(await screen.findByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("5 members")).toBeInTheDocument();
    expect(screen.getByText("10 labels")).toBeInTheDocument();
    expect(screen.getByText("6 statuses")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument();
  });

  it("opens leave team dialog and confirms", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTeamHubData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Left Engineering.",
          redirectTo: "/settings",
        }),
      } as Response);

    render(<TeamSettingsHubPage />);
    await screen.findByText("Engineering");

    // The button in the Danger Zone
    const dangerZoneButtons = screen.getAllByRole("button");
    const leaveButton = dangerZoneButtons.find(btn => btn.textContent === "Leave team");
    expect(leaveButton).toBeDefined();
    if (leaveButton) fireEvent.click(leaveButton);

    expect(screen.getByText("Leave team?")).toBeInTheDocument();
    expect(
      screen.getByText("You will lose access to Engineering until someone adds you back."),
    ).toBeInTheDocument();

    // The button in the Dialog
    const dialog = screen.getByRole("dialog");
    const confirmButton = within(dialog).getByRole("button", { name: "Leave team" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/teams/ENG/settings",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ action: "leave" }),
        }),
      );
      expect(pushMock).toHaveBeenCalledWith("/settings");
    });
  });

  it("opens delete team dialog and confirms", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTeamHubData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Engineering was deleted.",
          redirectTo: "/settings",
        }),
      } as Response);

    render(<TeamSettingsHubPage />);
    await screen.findByText("Engineering");

    const dangerZoneButtons = screen.getAllByRole("button");
    const deleteButton = dangerZoneButtons.find(btn => btn.textContent === "Delete team");
    expect(deleteButton).toBeDefined();
    if (deleteButton) fireEvent.click(deleteButton);

    expect(screen.getByText("Delete team?")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    const confirmButton = within(dialog).getByRole("button", { name: "Delete team" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/teams/ENG/settings",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ action: "delete" }),
        }),
      );
      expect(pushMock).toHaveBeenCalledWith("/settings");
    });
  });
});
