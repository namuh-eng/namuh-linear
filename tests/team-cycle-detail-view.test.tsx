import CycleDetailPage from "@/app/(app)/team/[key]/cycles/[cycleId]/page";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG", cycleId: "cycle-1" }),
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => "/team/ENG/cycles/cycle-1",
  useSearchParams: () => new URLSearchParams(),
}));

const mockCycleDetailResponse = {
  team: { id: "team-1", name: "Engineering", key: "ENG" },
  cycle: {
    id: "cycle-1",
    name: "Cycle 1",
    number: 1,
    startDate: "2026-05-01",
    endDate: "2026-05-14",
    autoRollover: true,
    issueCount: 1,
    completedIssueCount: 0,
  },
  groups: [
    {
      state: {
        id: "state-1",
        name: "In Progress",
        category: "started",
        color: "#f2c94c",
        position: 1,
      },
      issues: [
        {
          id: "issue-1",
          number: 123,
          identifier: "ENG-123",
          title: "Fix cycle row navigation",
          priority: "medium",
          stateId: "state-1",
          assigneeId: null,
          assignee: null,
          creatorId: "user-1",
          creatorName: "Ada",
          labels: [{ id: "label-1", name: "Bug", color: "#ef4444" }],
          labelIds: ["label-1"],
          projectId: "project-1",
          projectName: "Roadmap",
          cycleId: "cycle-1",
          cycleName: "Cycle 1",
          estimate: 2,
          dueDate: "2026-05-12T00:00:00.000Z",
          createdAt: "2026-05-10T00:00:00.000Z",
        },
      ],
    },
  ],
  filterOptions: {
    statuses: [
      {
        id: "state-1",
        name: "In Progress",
        category: "started",
        color: "#f2c94c",
      },
    ],
    assignees: [],
    labels: [{ id: "label-1", name: "Bug", color: "#ef4444" }],
    projects: [{ id: "project-1", name: "Roadmap" }],
    creators: [{ id: "user-1", name: "Ada" }],
    cycles: [{ id: "cycle-1", name: "Cycle 1" }],
    estimates: [{ value: "2", label: "2" }],
    dueDates: [{ value: "2026-05-12", label: "May 12" }],
    priorities: [
      { value: "urgent", label: "Urgent" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
      { value: "none", label: "No priority" },
    ],
  },
};

const createIssueOptionsResponse = {
  team: { id: "team-1", name: "Engineering", key: "ENG" },
  statuses: [
    {
      id: "state-1",
      name: "In Progress",
      category: "started",
      color: "#f2c94c",
    },
  ],
  priorities: [{ value: "none", label: "No priority" }],
  assignees: [],
  labels: [],
  projects: [],
};

function mockJsonResponse(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload,
  } as Response;
}

describe("CycleDetailPage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input, init) => {
        const url = String(input);
        if (url === "/api/teams/ENG/cycles/cycle-1" && !init?.method) {
          return mockJsonResponse(mockCycleDetailResponse);
        }
        if (url === "/api/teams/ENG/display-options") {
          return mockJsonResponse({ displayOptions: null });
        }
        if (url === "/api/teams/ENG/create-issue-options") {
          return mockJsonResponse(createIssueOptionsResponse);
        }
        if (url === "/api/issue-templates") {
          return mockJsonResponse({ templates: [] });
        }
        if (
          url === "/api/teams/ENG/cycles/cycle-1" &&
          init?.method === "PATCH"
        ) {
          return mockJsonResponse({
            ...mockCycleDetailResponse.cycle,
            name: "Renamed cycle",
          });
        }
        if (
          url === "/api/teams/ENG/cycles/cycle-1" &&
          init?.method === "DELETE"
        ) {
          return mockJsonResponse({ success: true });
        }
        return mockJsonResponse({});
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
    pushMock.mockReset();
  });

  it("renders cycle issue rows as links to issue detail", async () => {
    render(<CycleDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Cycle 1")).toBeInTheDocument();
    });

    const issueLink = screen.getByRole("link", {
      name: /eng-123 fix cycle row navigation/i,
    });

    expect(issueLink).toHaveAttribute("href", "/team/ENG/issue/ENG-123");
  });

  it("renders cycle management, filter, search, and display controls", async () => {
    render(<CycleDetailPage />);

    expect(
      await screen
        .findAllByRole("button", { name: "Add issue" })
        .then((buttons) => buttons[0]),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit cycle" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search cycle issues" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Display options" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add filter" }),
    ).toBeInTheDocument();
  });

  it("patches cycle metadata from the edit form", async () => {
    render(<CycleDetailPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Edit cycle" }));
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Renamed cycle" },
    });
    fireEvent.click(screen.getByLabelText("Auto-rollover unfinished issues"));
    fireEvent.submit(screen.getByRole("form", { name: "Edit cycle" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/teams/ENG/cycles/cycle-1",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"name":"Renamed cycle"'),
        }),
      );
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/teams/ENG/cycles/cycle-1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"autoRollover":false'),
      }),
    );
  });

  it("deletes cycle after confirmation and redirects to the cycle list", async () => {
    render(<CycleDetailPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalledWith(
        "Delete Cycle 1? Issues stay in Engineering but will be removed from this cycle.",
      );
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/teams/ENG/cycles/cycle-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/team/ENG/cycles");
  });

  it("opens create issue with cycle context", async () => {
    render(<CycleDetailPage />);

    fireEvent.click(
      await screen
        .findAllByRole("button", { name: "Add issue" })
        .then((buttons) => buttons[0]),
    );

    expect(await screen.findByText("New issue")).toBeInTheDocument();
    expect(screen.getByText("Cycle: Cycle 1")).toBeInTheDocument();
  });
});
