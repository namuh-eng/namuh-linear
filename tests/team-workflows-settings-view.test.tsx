import TeamWorkflowsSettingsPage from "@/app/(app)/settings/teams/[key]/workflows/page";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mockNavigation = vi.hoisted(() => ({
  params: { key: "TEAM" } as Record<string, string>,
}));

vi.mock("next/navigation", () => ({
  useParams: () => mockNavigation.params,
}));

const mockTeam = {
  name: "Team Name",
  detailedHistory: false,
  workflowStates: [
    { id: "state-backlog", name: "Backlog", category: "backlog" },
    { id: "state-ready", name: "Ready", category: "unstarted" },
    { id: "state-done", name: "Done", category: "completed" },
  ],
  workflowAutomation: {
    gitBranchFormat: "{teamKey}-{issueNumber}-{issueTitle}",
    gitBranchAutomationEnabled: false,
    gitPrAutomationEnabled: false,
    gitBranchCreateTargetStatusId: null,
    gitPrMergeTargetStatusId: null,
    autoAssignEnabled: false,
    autoAssignMode: "none",
    defaultAssigneeId: null,
    statusTransitionRules: [],
  },
};

describe("TeamWorkflowsSettingsPage", () => {
  beforeEach(() => {
    mockNavigation.params = { key: "TEAM" };
    vi.stubGlobal(
      "fetch",
      vi.fn((url, options) => {
        if (url === "/api/teams/TEAM/settings" && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ team: mockTeam }),
          });
        }
        if (url === "/api/teams/TEAM/settings" && options?.method === "PATCH") {
          const body = JSON.parse(options.body as string);
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                team: {
                  ...mockTeam,
                  ...body,
                  workflowAutomation:
                    body.workflowAutomation ?? mockTeam.workflowAutomation,
                },
              }),
          });
        }
        return Promise.reject(new Error("Unhandled fetch"));
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders workflow automation sections and workspace-prefixed back link", async () => {
    mockNavigation.params = { key: "TEAM", workspaceSlug: "foreverbrowsing" };

    render(<TeamWorkflowsSettingsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Workflows & automations")).toBeInTheDocument();
    });

    expect(screen.getByText("Git workflows")).toBeInTheDocument();
    expect(screen.getByText("Auto-assignment")).toBeInTheDocument();
    expect(screen.getByText("Status transition rules")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Enable detailed issue history"),
    ).toBeInTheDocument();
    expect(screen.getByText("Back to team settings")).toHaveAttribute(
      "href",
      "/foreverbrowsing/settings/teams/TEAM",
    );
  });

  it("saves Git workflow, auto-assignment, and transition rules", async () => {
    render(<TeamWorkflowsSettingsPage />);
    await waitFor(() => screen.getByLabelText("Branch name format"));

    fireEvent.change(screen.getByLabelText("Branch name format"), {
      target: { value: "ENG-{issueNumber}" },
    });
    fireEvent.click(screen.getByLabelText("Move issue when branch is created"));
    fireEvent.change(screen.getByLabelText("Branch creation target status"), {
      target: { value: "state-ready" },
    });
    fireEvent.click(screen.getByLabelText("Enable auto-assignment"));
    fireEvent.change(screen.getByLabelText("Assignment mode"), {
      target: { value: "round_robin" },
    });

    fireEvent.click(screen.getByText("Add transition rule"));
    fireEvent.change(screen.getByLabelText("Rule 1 name"), {
      target: { value: "Complete merged PRs" },
    });
    fireEvent.change(screen.getByLabelText("Rule 1 trigger"), {
      target: { value: "pull_request_merged" },
    });
    fireEvent.change(screen.getByLabelText("Rule 1 target status"), {
      target: { value: "state-done" },
    });

    fireEvent.click(screen.getByText("Save automation settings"));

    await waitFor(() => {
      expect(
        screen.getByText("Workflow automation updated"),
      ).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/teams/TEAM/settings",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("workflowAutomation"),
      }),
    );
    const saveCall = vi
      .mocked(global.fetch)
      .mock.calls.find(([, options]) => options?.method === "PATCH");
    const body = JSON.parse(saveCall?.[1]?.body as string);
    expect(body.workflowAutomation).toMatchObject({
      gitBranchFormat: "ENG-{issueNumber}",
      gitBranchAutomationEnabled: true,
      gitBranchCreateTargetStatusId: "state-ready",
      autoAssignEnabled: true,
      autoAssignMode: "round_robin",
    });
    expect(body.workflowAutomation.statusTransitionRules[0]).toMatchObject({
      name: "Complete merged PRs",
      trigger: "pull_request_merged",
      targetStatusId: "state-done",
    });
  });

  it("validates missing transition target before saving", async () => {
    render(<TeamWorkflowsSettingsPage />);
    await waitFor(() => screen.getByText("Add transition rule"));

    fireEvent.click(screen.getByText("Add transition rule"));
    fireEvent.change(screen.getByLabelText("Rule 1 target status"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByText("Save automation settings"));

    expect(
      await screen.findByText(
        "Select a target status for every transition rule",
      ),
    ).toBeInTheDocument();
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });

  it("handles toggling detailed history and saving", async () => {
    render(<TeamWorkflowsSettingsPage />);
    await waitFor(() => screen.getByLabelText("Enable detailed issue history"));

    const toggle = screen.getByLabelText("Enable detailed issue history");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByText("Workflow settings updated")).toBeInTheDocument();
    });

    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/teams/TEAM/settings",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ detailedHistory: true }),
      }),
    );
  });

  it("shows API error message when automation save fails", async () => {
    vi.mocked(global.fetch).mockImplementation((url, options) => {
      if (url === "/api/teams/TEAM/settings" && options?.method === "PATCH") {
        return Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              error: "Transition rules require a target status",
            }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ team: mockTeam }),
      } as Response);
    });

    render(<TeamWorkflowsSettingsPage />);
    await waitFor(() => screen.getByText("Save automation settings"));

    fireEvent.click(screen.getByText("Save automation settings"));

    await waitFor(() => {
      expect(
        screen.getByText("Transition rules require a target status"),
      ).toBeInTheDocument();
    });
  });

  it("shows team not found when API returns null team", async () => {
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ team: null }),
      } as Response),
    );

    render(<TeamWorkflowsSettingsPage />);
    await waitFor(() => {
      expect(screen.getByText("Team not found")).toBeInTheDocument();
    });
  });
});
