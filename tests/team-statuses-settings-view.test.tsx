import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockStatuses = {
  triage: [{ id: "s-1", name: "Triage", issueCount: 0, description: null, isDefault: true }],
  backlog: [{ id: "s-2", name: "Backlog", issueCount: 10, description: "Parked items" }],
  unstarted: [{ id: "s-3", name: "Todo", issueCount: 5, description: null }],
  started: [{ id: "s-4", name: "In Progress", issueCount: 3, description: null }],
  completed: [{ id: "s-5", name: "Done", issueCount: 50, description: null }],
  canceled: [{ id: "s-6", name: "Canceled", issueCount: 2, description: null }],
};

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG" }),
}));

describe("TeamIssueStatusesPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then statuses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ statuses: mockStatuses }),
    }));

    render(<TeamIssueStatusesPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Issue statuses")).toBeInTheDocument();
    expect(screen.getAllByText("Triage").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Backlog").length).toBeGreaterThan(0);
    expect(screen.getByText("10 issues")).toBeInTheDocument();
    expect(screen.getByText("Parked items")).toBeInTheDocument();
  });
});

import TeamIssueStatusesPage from "@/app/(app)/settings/teams/[key]/statuses/page";
