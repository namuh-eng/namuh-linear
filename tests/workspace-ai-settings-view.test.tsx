import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AISettingsPage from "../src/app/(app)/settings/ai/page";

const aiPayload = {
  ai: {
    enabled: true,
    agentRunsEnabled: true,
    agentGuidance: "Cite evidence before acting.",
    agentGuidanceRole: "admins",
    canManageSettings: true,
    integrationBoundary:
      "Workspace AI and agent run toggles are enforced by /api/agent/runs.",
  },
};

const analyticsPayload = {
  workspaceId: "workspace-1",
  completedLast30Days: [
    { teamId: "team-1", teamName: "Engineering", completedCount: 4 },
  ],
  activeIssues: [{ teamId: "team-1", teamName: "Engineering", activeCount: 7 }],
  period: "Last 30 days",
};

function mockInitialFetch(payload = aiPayload) {
  (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    async (url: string, init?: RequestInit) => {
      if (url === "/api/workspaces/current/ai" && !init?.method) {
        return { ok: true, json: async () => payload };
      }
      if (url === "/api/analytics/workspace") {
        return { ok: true, json: async () => analyticsPayload };
      }
      if (url === "/api/workspaces/current/ai" && init?.method === "PATCH") {
        const patch = JSON.parse(String(init.body));
        return {
          ok: true,
          json: async () => ({ ai: { ...aiPayload.ai, ...patch } }),
        };
      }
      return { ok: false, json: async () => ({ error: "Unexpected request" }) };
    },
  );
}

describe("AISettingsPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders persisted controls and analytics as secondary content", async () => {
    mockInitialFetch();

    render(<AISettingsPage />);

    expect(screen.getByText("Loading workspace AI settings...")).toBeDefined();
    await waitFor(() => screen.getByText("Workspace AI availability"));

    expect(
      screen.getByLabelText("Enable AI features").getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByLabelText("Enable agent runs").getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByLabelText("Workspace AI guidance")).toHaveProperty(
      "value",
      "Cite evidence before acting.",
    );
    expect(
      screen.getByLabelText("Team guidance edit permission"),
    ).toHaveProperty("value", "admins");
    expect(screen.getByText("Engineering")).toBeDefined();
    expect(screen.getByText("Issues Completed")).toBeDefined();
  });

  it("saves toggles, guidance, and permission changes", async () => {
    mockInitialFetch();

    render(<AISettingsPage />);
    await waitFor(() => screen.getByText("Workspace AI availability"));

    fireEvent.click(screen.getByLabelText("Enable AI features"));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/workspaces/current/ai",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"enabled":false'),
        }),
      );
    });

    const guidance = screen.getByLabelText("Workspace AI guidance");
    await userEvent.clear(guidance);
    await userEvent.type(guidance, "Do not auto-merge changes.");
    fireEvent.blur(guidance);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/workspaces/current/ai",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("Do not auto-merge changes."),
        }),
      );
    });

    await userEvent.selectOptions(
      screen.getByLabelText("Team guidance edit permission"),
      "members",
    );
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/workspaces/current/ai",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"agentGuidanceRole":"members"'),
        }),
      );
    });
  });

  it("renders read-only state for non-admin viewers", async () => {
    mockInitialFetch({
      ai: { ...aiPayload.ai, canManageSettings: false },
    });

    render(<AISettingsPage />);
    await waitFor(() => screen.getByText(/only workspace admins can change/));

    expect(screen.getByLabelText("Enable AI features")).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByLabelText("Workspace AI guidance")).toHaveProperty(
      "disabled",
      true,
    );
  });
});
