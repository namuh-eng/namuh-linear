import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TeamBoardPage from "@/app/(app)/team/[key]/board/page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG" }),
  useRouter: () => ({ push: vi.fn() }),
}));

function buildBoardResponse() {
  return {
    team: { id: "team-1", name: "Engineering", key: "ENG" },
    groups: [
      {
        state: {
          id: "state-backlog",
          name: "Backlog",
          category: "backlog",
          color: "#6b6f76",
        },
        issues: [
          {
            id: "issue-1",
            identifier: "ENG-1",
            title: "First board issue",
            priority: "none",
            stateId: "state-backlog",
            assigneeId: null,
            assignee: null,
            labels: [],
            labelIds: [],
            projectId: null,
            createdAt: "2026-04-07T00:00:00.000Z",
          },
        ],
      },
      {
        state: {
          id: "state-todo",
          name: "Todo",
          category: "unstarted",
          color: "#f2c94c",
        },
        issues: [],
      },
    ],
    filterOptions: {
      statuses: [],
      assignees: [],
      labels: [],
      priorities: [],
    },
  };
}

describe("TeamBoardPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    let boardData = buildBoardResponse();

    global.fetch = vi.fn((input, init) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url === "/api/teams/ENG/display-options") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ displayOptions: null }),
        });
      }

      if (url === "/api/teams/ENG/issues") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(structuredClone(boardData)),
        });
      }

      if (url === "/api/issues/issue-1" && init?.method === "PATCH") {
        const body = JSON.parse(String(init.body));
        expect(body).toEqual({ stateId: "state-todo" });

        const movedIssue = boardData.groups[0].issues[0];
        boardData = {
          ...boardData,
          groups: [
            {
              ...boardData.groups[0],
              issues: [],
            },
            {
              ...boardData.groups[1],
              issues: [{ ...movedIssue, stateId: "state-todo" }],
            },
          ],
        };

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: "issue-1" }),
        });
      }

      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    }) as unknown as typeof fetch;
  });

  it("moves an issue to another column with drag and drop", async () => {
    render(<TeamBoardPage />);

    const backlogColumn = await screen.findByTestId(
      "board-column-state-backlog",
    );
    const todoColumn = await screen.findByTestId("board-column-state-todo");
    const card = within(backlogColumn).getByText("First board issue");
    const cardWrapper = card.closest("[data-testid='issue-card']");
    const todoDropZone = screen.getByTestId("board-column-state-todo-cards");

    expect(cardWrapper).not.toBeNull();

    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: vi.fn(),
    };

    fireEvent.dragStart(cardWrapper as HTMLElement, { dataTransfer });
    fireEvent.dragOver(todoDropZone, { dataTransfer });
    fireEvent.drop(todoDropZone, { dataTransfer });

    await waitFor(() => {
      expect(
        within(screen.getByTestId("board-column-state-todo")).getByText(
          "First board issue",
        ),
      ).toBeDefined();
    });

    expect(within(todoColumn).getByText("First board issue")).toBeDefined();
    expect(within(backlogColumn).queryByText("First board issue")).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/issues/issue-1",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
  });

  it("updates board cards when display properties are toggled", async () => {
    render(<TeamBoardPage />);

    expect(await screen.findByText("ENG-1")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /display options/i }));
    fireEvent.click(screen.getByTestId("property-id"));

    await waitFor(() => {
      expect(screen.queryByText("ENG-1")).toBeNull();
    });
  });
});
