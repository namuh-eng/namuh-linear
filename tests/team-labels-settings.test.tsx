import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamLabelsSettingsPage from "@/app/(app)/settings/teams/[key]/labels/page";
import { useParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useLink: vi.fn(),
}));

describe("TeamLabelsSettingsPage - Integration", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockTeam = {
    team: { name: "Engineering" },
  };

  const mockLabels = {
    labels: [
      { id: "l-1", name: "Bug", color: "#ff0000" },
      { id: "l-2", name: "Feature", color: "#00ff00" },
    ],
  };

  it("renders team labels list from API", async () => {
    vi.mocked(useParams).mockReturnValue({ key: "ENG" });
    
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLabels),
      })
    );

    render(<TeamLabelsSettingsPage />);

    await waitFor(() => expect(screen.getByText("Issue labels")).toBeInTheDocument());
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
  });
});
