import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsLayout from "@/app/(app)/settings/layout";
import { useAppShellContext } from "@/app/(app)/app-shell";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("@/app/(app)/app-shell", () => ({
  useAppShellContext: vi.fn(),
}));

describe("SettingsLayout component", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the settings sidebar with default sections", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account/preferences");
    vi.mocked(useAppShellContext).mockReturnValue({
      user: { id: "u-1", name: "Ashley" },
      activeWorkspaceId: "ws-1",
      teams: [],
      workspaces: [],
    } as any);

    render(
      <SettingsLayout>
        <div data-testid="children">Content</div>
      </SettingsLayout>
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  it("renders the 'Your teams' section when teams are present in context", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account/preferences");
    vi.mocked(useAppShellContext).mockReturnValue({
      user: { id: "u-1", name: "Ashley" },
      activeWorkspaceId: "ws-1",
      teams: [
        { id: "t-1", name: "Engineering", key: "ENG" },
        { id: "t-2", name: "Design", key: "DSGN" },
      ],
      workspaces: [],
    } as any);

    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>
    );

    expect(screen.getByText("Your teams")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
    
    const engLink = screen.getByText("Engineering");
    expect(engLink.closest("a")).toHaveAttribute("href", "/settings/teams/ENG");
  });

  it("marks the active link based on the pathname", () => {
    vi.mocked(usePathname).mockReturnValue("/settings/account/profile");
    vi.mocked(useAppShellContext).mockReturnValue({
      user: { id: "u-1", name: "Ashley" },
      activeWorkspaceId: "ws-1",
      teams: [],
      workspaces: [],
    } as any);

    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>
    );

    const activeLink = screen.getByText("Profile");
    expect(activeLink).toHaveClass("bg-[var(--color-surface-active)]");
    
    const inactiveLink = screen.getByText("Preferences");
    expect(inactiveLink).not.toHaveClass("bg-[var(--color-surface-active)]");
  });

  it("handles deep paths for active state matching", () => {
    // Testing startsWith logic in isActiveSettingsPath
    vi.mocked(usePathname).mockReturnValue("/settings/account/notifications/email");
    vi.mocked(useAppShellContext).mockReturnValue({
      user: { id: "u-1", name: "Ashley" },
      activeWorkspaceId: "ws-1",
      teams: [],
      workspaces: [],
    } as any);

    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>
    );

    const activeLink = screen.getByText("Notifications");
    expect(activeLink).toHaveClass("bg-[var(--color-surface-active)]");
  });
});
