import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import WorkspaceSettingsPage from "@/app/(app)/settings/workspace/page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: vi.fn(),
  }),
}));

const mockWorkspaceData = {
  id: "ws-123",
  name: "Acme Corp",
  urlSlug: "acme",
  logo: "data:image/png;base64,abc",
  region: "United States",
  fiscalMonth: "january",
};

describe("WorkspaceSettingsPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then workspace settings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ workspace: mockWorkspaceData }),
    }));

    render(<WorkspaceSettingsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Workspace name")).toHaveValue("Acme Corp");
    expect(screen.getByLabelText("Workspace URL slug")).toHaveValue("acme");
    expect(screen.getByLabelText("First month of fiscal year")).toHaveValue("january");
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("updates workspace name on blur", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: mockWorkspaceData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: { ...mockWorkspaceData, name: "New Name" } }),
      })
    );

    render(<WorkspaceSettingsPage />);
    await waitFor(() => screen.getByLabelText("Workspace name"));

    const input = screen.getByLabelText("Workspace name");
    fireEvent.change(input, { target: { value: "New Name" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"name":"New Name"'),
      }));
    });

    expect(screen.getByText("Workspace updated.")).toBeInTheDocument();
  });

  it("updates fiscal month on change", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: mockWorkspaceData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: { ...mockWorkspaceData, fiscalMonth: "july" } }),
      })
    );

    render(<WorkspaceSettingsPage />);
    await waitFor(() => screen.getByLabelText("First month of fiscal year"));

    const select = screen.getByLabelText("First month of fiscal year");
    fireEvent.change(select, { target: { value: "july" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"fiscalMonth":"july"'),
      }));
    });

    expect(screen.getByText("Workspace updated.")).toBeInTheDocument();
  });

  it("opens delete dialog and deletes workspace", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: mockWorkspaceData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirectTo: "/login" }),
      })
    );

    render(<WorkspaceSettingsPage />);
    await waitFor(() => screen.getByText("Delete workspace"));

    fireEvent.click(screen.getByText("Delete workspace"));
    expect(screen.getByText("Delete workspace?")).toBeInTheDocument();

    const input = screen.getByLabelText("Confirm workspace name");
    fireEvent.change(input, { target: { value: "Acme Corp" } });
    
    // There are two buttons with this text: trigger and modal confirm
    const buttons = screen.getAllByRole("button", { name: "Delete workspace" });
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current", expect.objectContaining({
        method: "DELETE",
      }));
    });

    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
