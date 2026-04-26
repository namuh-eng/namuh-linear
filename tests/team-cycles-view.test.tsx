import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ key: "ENG" }),
}));

import TeamCyclesPage from "@/app/(app)/team/[key]/cycles/page";

const mockCyclesData = {
  team: {
    id: "team-1",
    name: "Engineering",
    key: "ENG",
    cyclesEnabled: true,
    cycleStartDay: 1,
    cycleDurationWeeks: 2,
    timezone: "UTC",
  },
  cycles: [
    {
      id: "c1",
      name: "Current Sprint",
      number: 1,
      teamId: "team-1",
      startDate: "2026-04-20T00:00:00Z",
      endDate: "2026-05-03T00:00:00Z",
      issueCount: 5,
      completedIssueCount: 2,
    },
    {
      id: "c2",
      name: "Upcoming Sprint",
      number: 2,
      teamId: "team-1",
      startDate: "2026-05-04T00:00:00Z",
      endDate: "2026-05-17T00:00:00Z",
      issueCount: 0,
      completedIssueCount: 0,
    },
  ],
};

describe("TeamCyclesPage UI", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders loading state then cycle list", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockCyclesData,
    } as Response);

    // Mock Date to be within the first cycle
    vi.setSystemTime(new Date("2026-04-25T10:00:00Z"));

    render(<TeamCyclesPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    expect(await screen.findByText("Current Cycle")).toBeInTheDocument();
    expect(screen.getByText("Current Sprint")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Sprint")).toBeInTheDocument();
  });

  it("shows the create cycle form and submits", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
        if (url.toString().includes("/api/teams/ENG/cycles") && !url.toString().includes("POST")) {
            return Promise.resolve({
                ok: true,
                json: async () => mockCyclesData,
            } as Response);
        }
        if (url.toString().includes("/api/teams/ENG/cycles") && url.toString().includes("POST")) {
            return Promise.resolve({
                ok: true,
                json: async () => ({ id: "c3" }),
            } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    render(<TeamCyclesPage />);
    await screen.findByText("Current Sprint");

    fireEvent.click(screen.getByRole("button", { name: "New cycle" }));

    fireEvent.change(screen.getByPlaceholderText("Cycle name (optional)"), {
      target: { value: "Sprint 3" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create cycle" }));

    await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          "/api/teams/ENG/cycles",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"name":"Sprint 3"'),
          }),
        );
    });
  });

  it("shows empty state when team has no cycles", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockCyclesData, cycles: [] }),
    } as Response);

    render(<TeamCyclesPage />);

    expect(await screen.findByText("No active cycle")).toBeInTheDocument();
  });
});
