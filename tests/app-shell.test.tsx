import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/inbox",
  useRouter: () => ({ push: vi.fn() }),
  Link: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { AppShell } from "@/app/(app)/app-shell";
import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders workspace name", () => {
    render(<Sidebar workspaceName="My Workspace" />);
    expect(screen.getByText("My Workspace")).toBeDefined();
  });

  it("renders workspace initials", () => {
    render(<Sidebar workspaceInitials="MW" />);
    expect(screen.getByText("MW")).toBeDefined();
  });

  it("renders personal navigation links", () => {
    render(<Sidebar />);
    expect(screen.getByText("Inbox")).toBeDefined();
    expect(screen.getByText("My Issues")).toBeDefined();
  });

  it("renders workspace section with Projects and Views", () => {
    render(<Sidebar />);
    // There should be both workspace-level and team-level Projects/Views
    const projectLinks = screen.getAllByText("Projects");
    expect(projectLinks.length).toBeGreaterThanOrEqual(2);
    const viewLinks = screen.getAllByText("Views");
    expect(viewLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("renders team section with team name", () => {
    render(<Sidebar teamName="Frontend" teamKey="FE" />);
    expect(screen.getByText("Frontend")).toBeDefined();
  });

  it("renders team sub-navigation items", () => {
    render(<Sidebar teamKey="ENG" />);
    expect(screen.getByText("Triage")).toBeDefined();
    expect(screen.getByText("Issues")).toBeDefined();
  });

  it("renders Initiatives and Cycles in Try section", () => {
    render(<Sidebar />);
    expect(screen.getByText("Initiatives")).toBeDefined();
    expect(screen.getByText("Cycles")).toBeDefined();
  });

  it("has search button", () => {
    render(<Sidebar />);
    expect(screen.getByLabelText("Search")).toBeDefined();
  });

  it("has create issue button", () => {
    render(<Sidebar />);
    expect(screen.getByLabelText("Create issue")).toBeDefined();
  });

  it("has help button", () => {
    render(<Sidebar />);
    expect(screen.getByLabelText("Help")).toBeDefined();
  });

  it("toggles team section collapse", () => {
    render(<Sidebar />);
    // Team section should be expanded by default
    expect(screen.getByText("Triage")).toBeDefined();

    // Click "Your teams" header to collapse
    fireEvent.click(screen.getByText("Your teams"));
    expect(screen.queryByText("Triage")).toBeNull();

    // Click again to expand
    fireEvent.click(screen.getByText("Your teams"));
    expect(screen.getByText("Triage")).toBeDefined();
  });

  it("links point to correct routes", () => {
    render(<Sidebar teamKey="ENG" />);
    const inboxLink = screen.getByText("Inbox").closest("a");
    expect(inboxLink?.getAttribute("href")).toBe("/inbox");

    const issuesLink = screen.getByText("Issues").closest("a");
    expect(issuesLink?.getAttribute("href")).toBe("/team/ENG/all");
  });
});

describe("AppShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders sidebar and content area", () => {
    render(
      <AppShell
        workspaceName="Test"
        workspaceInitials="TE"
        teamName="Eng"
        teamKey="ENG"
      >
        <div>Content</div>
      </AppShell>,
    );
    expect(screen.getByText("Test")).toBeDefined();
    expect(screen.getByText("Content")).toBeDefined();
  });

  it("renders children in the content area", () => {
    render(
      <AppShell
        workspaceName="WS"
        workspaceInitials="WS"
        teamName="Team"
        teamKey="T"
      >
        <h1>Hello World</h1>
      </AppShell>,
    );
    expect(screen.getByText("Hello World")).toBeDefined();
  });

  it("has rounded content container with correct background", () => {
    const { container } = render(
      <AppShell
        workspaceName="WS"
        workspaceInitials="WS"
        teamName="Team"
        teamKey="T"
      >
        <div>Test</div>
      </AppShell>,
    );
    const contentDiv = container.querySelector(".rounded-xl");
    expect(contentDiv).not.toBeNull();
  });
});
