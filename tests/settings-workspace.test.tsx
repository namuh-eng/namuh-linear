import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import WorkspaceSettingsPage from "@/app/(app)/settings/workspace/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/settings/workspace",
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockWorkspace() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      workspace: {
        name: "Acme Corp",
        urlSlug: "acme",
        logo: null,
        region: "United States",
      },
    }),
  });
}

function waitForLoaded() {
  return waitFor(() => {
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
}

describe("Workspace Settings Page", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Workspace heading", async () => {
    mockWorkspace();
    render(<WorkspaceSettingsPage />);
    await waitForLoaded();
    expect(
      screen.getByRole("heading", { name: "Workspace" }),
    ).toBeInTheDocument();
  });

  it("renders logo upload section", async () => {
    mockWorkspace();
    render(<WorkspaceSettingsPage />);
    await waitForLoaded();
    expect(screen.getByText("Logo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload logo" }),
    ).toBeInTheDocument();
  });

  it("renders editable workspace name", async () => {
    mockWorkspace();
    render(<WorkspaceSettingsPage />);
    await waitForLoaded();
    const nameInput = screen.getByLabelText(
      "Workspace name",
    ) as HTMLInputElement;
    expect(nameInput.value).toBe("Acme Corp");
  });

  it("renders URL slug with prefix", async () => {
    mockWorkspace();
    render(<WorkspaceSettingsPage />);
    await waitForLoaded();
    expect(screen.getByText("linear.app/")).toBeInTheDocument();
    const urlInput = screen.getByLabelText(
      "Workspace URL slug",
    ) as HTMLInputElement;
    expect(urlInput.value).toBe("acme");
  });

  it("renders Time & region section", async () => {
    mockWorkspace();
    render(<WorkspaceSettingsPage />);
    await waitForLoaded();
    expect(screen.getByText("Time & region")).toBeInTheDocument();
    expect(screen.getByText("First month of fiscal year")).toBeInTheDocument();
    expect(screen.getByText("Region")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
  });

  it("renders Welcome message configure button", async () => {
    mockWorkspace();
    render(<WorkspaceSettingsPage />);
    await waitForLoaded();
    expect(screen.getByText("Welcome message")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Configure" }),
    ).toBeInTheDocument();
  });

  it("renders Danger zone with delete button", async () => {
    mockWorkspace();
    render(<WorkspaceSettingsPage />);
    await waitForLoaded();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete workspace" }),
    ).toBeInTheDocument();
  });
});
