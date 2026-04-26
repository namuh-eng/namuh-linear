import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamWorkflowsSettingsPage from "@/app/(app)/settings/teams/[key]/workflows/page";
import { useParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useLink: vi.fn(),
}));

describe("TeamWorkflowsSettingsPage - Integration", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockTeam = {
    team: {
      name: "Engineering",
      detailedHistory: true,
    },
  };

  it("renders workflow toggle based on API state", async () => {
    vi.mocked(useParams).mockReturnValue({ key: "ENG" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTeam),
    }));

    render(<TeamWorkflowsSettingsPage />);

    await waitFor(() => expect(screen.getByText("Workflows & automations")).toBeInTheDocument());

    const toggle = screen.getByRole("switch", { name: "Enable detailed issue history" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("updates workflow state via PATCH API when toggled", async () => {
    vi.mocked(useParams).mockReturnValue({ key: "ENG" });
    
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<TeamWorkflowsSettingsPage />);

    await waitFor(() => expect(screen.getByText("Workflows & automations")).toBeInTheDocument());

    const toggle = screen.getByRole("switch", { name: "Enable detailed issue history" });
    
    // Toggle off
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/teams/ENG/settings", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ detailedHistory: false }),
      }));
    });

    expect(screen.getByText("Workflow settings updated")).toBeInTheDocument();
  });
});
