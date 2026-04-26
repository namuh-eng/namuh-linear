import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import WorkspaceSettingsPage from "@/app/(app)/settings/workspace/page";

const mockWorkspace = {
  id: "ws-123",
  name: "Acme Corp",
  urlSlug: "acme",
  logo: "https://example.com/logo.png",
  region: "United States",
  fiscalMonth: "january",
};

describe("WorkspaceSettingsPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then workspace details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ workspace: mockWorkspace }),
    }));

    render(<WorkspaceSettingsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("acme")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("updates workspace name on blur", async () => {
    const fetchMock = vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: mockWorkspace }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: { ...mockWorkspace, name: "New Name" } }),
      })
    );

    render(<WorkspaceSettingsPage />);
    await waitFor(() => screen.getByDisplayValue("Acme Corp"));

    const nameInput = screen.getByLabelText("Workspace name");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"name":"New Name"'),
      }));
    });

    expect(screen.getByText("Workspace updated.")).toBeInTheDocument();
  });

  it("opens delete dialog and confirms deletion", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: mockWorkspace }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ redirectTo: "/onboard" }),
      })
    );

    render(<WorkspaceSettingsPage />);
    await waitFor(() => screen.getByDisplayValue("Acme Corp"));

    fireEvent.click(screen.getByText("Delete workspace"));
    expect(screen.getByText("Delete workspace?")).toBeInTheDocument();

    const confirmInput = screen.getByLabelText("Confirm workspace name");
    fireEvent.change(confirmInput, { target: { value: "Acme Corp" } });

    const confirmButton = screen.getAllByRole("button", { name: "Delete workspace" }).find(
      btn => btn.closest("dialog")
    );
    if (!confirmButton) throw new Error("Confirm button not found in dialog");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText("Deleting...")).toBeInTheDocument();
    });
  });
});
