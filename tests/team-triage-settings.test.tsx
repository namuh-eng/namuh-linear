import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamTriageSettingsPage from "@/app/(app)/settings/teams/[key]/triage/page";
import { useParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useLink: vi.fn(),
}));

describe("TeamTriageSettingsPage - Integration", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockTeam = {
    team: {
      name: "Engineering",
      triageEnabled: true,
    },
  };

  it("renders triage toggle based on API state", async () => {
    vi.mocked(useParams).mockReturnValue({ key: "ENG" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTeam),
    }));

    render(<TeamTriageSettingsPage />);

    await waitFor(() => expect(screen.getByText("Triage")).toBeInTheDocument());

    const toggle = screen.getByRole("switch", { name: "Enable triage" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("updates triage state via PATCH API when toggled", async () => {
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

    render(<TeamTriageSettingsPage />);

    await waitFor(() => expect(screen.getByText("Triage")).toBeInTheDocument());

    const toggle = screen.getByRole("switch", { name: "Enable triage" });
    
    // Toggle off
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/teams/ENG/settings", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ triageEnabled: false }),
      }));
    });

    expect(screen.getByText("Triage settings updated")).toBeInTheDocument();
  });
});
