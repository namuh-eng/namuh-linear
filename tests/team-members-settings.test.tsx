import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamMembersSettingsPage from "@/app/(app)/settings/teams/[key]/members/page";
import { useParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useLink: vi.fn(),
}));

describe("TeamMembersSettingsPage - Integration", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockTeam = {
    team: { name: "Engineering" },
  };

  const mockMembers = {
    members: [
      { id: "tm-1", userId: "u-1", name: "Ashley", email: "ashley@example.com", role: "admin" },
      { id: "tm-2", userId: "u-2", name: "Jaeyun", email: "jaeyun@example.com", role: "member" },
    ],
  };

  it("renders team members list from API", async () => {
    vi.mocked(useParams).mockReturnValue({ key: "ENG" });
    
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeam),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMembers),
      })
    );

    render(<TeamMembersSettingsPage />);

    await waitFor(() => expect(screen.getByText("Members")).toBeInTheDocument());
    expect(screen.getByText("Ashley")).toBeInTheDocument();
    expect(screen.getByText("jaeyun@example.com")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });
});
