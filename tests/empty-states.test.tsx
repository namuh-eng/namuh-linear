import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import InboxPage from "@/app/(app)/inbox/page";
import InitiativesPage from "@/app/(app)/initiatives/page";
import MyIssuesTabPage from "@/app/(app)/my-issues/[tab]/page";
import ProjectsPage from "@/app/(app)/projects/page";
import TeamIssuesPage from "@/app/(app)/team/[key]/all/page";
import TeamBoardPage from "@/app/(app)/team/[key]/board/page";
import TeamCyclesPage from "@/app/(app)/team/[key]/cycles/page";
import TeamTriagePage from "@/app/(app)/team/[key]/triage/page";
import { EmptyState } from "@/components/empty-state";

vi.mock("next/navigation", () => ({
  usePathname: () => "/team/ENG/all",
  useParams: () => ({ key: "ENG" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("EmptyState component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders title", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeDefined();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="No items found" />);
    expect(screen.getByText("No items found")).toBeDefined();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText("No items found")).toBeNull();
  });

  it("renders icon when provided", () => {
    render(
      <EmptyState
        title="Empty"
        icon={<span data-testid="test-icon">icon</span>}
      />,
    );
    expect(screen.getByTestId("test-icon")).toBeDefined();
  });

  it("renders action button when onClick provided", () => {
    const onClick = vi.fn();
    render(<EmptyState title="Empty" action={{ label: "Create", onClick }} />);
    const button = screen.getByRole("button", { name: "Create" });
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it("renders action link when href provided", () => {
    render(
      <EmptyState
        title="Empty"
        action={{ label: "Go to settings", href: "/settings" }}
      />,
    );
    const link = screen.getByRole("link", { name: "Go to settings" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/settings");
  });
});

describe("Empty state pages", () => {
  afterEach(() => {
    cleanup();
  });

  it("Team Issues page shows 'No issues' with create CTA", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          team: { id: "1", name: "Engineering", key: "ENG" },
          groups: [],
        }),
    });
    render(<TeamIssuesPage />);
    expect(
      await screen.findByText("No issues", {}, { timeout: 2000 }),
    ).toBeDefined();
    expect(screen.getByText("Create issue")).toBeDefined();
  });

  it("Team Board page shows 'No issues' with create CTA", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          team: { id: "1", name: "Engineering", key: "ENG" },
          groups: [],
        }),
    });
    render(<TeamBoardPage />);
    expect(
      await screen.findByText("No issues", {}, { timeout: 2000 }),
    ).toBeDefined();
    expect(screen.getByText("Create issue")).toBeDefined();
  });

  it("Team Cycles page shows 'No active cycle'", () => {
    render(<TeamCyclesPage />);
    expect(screen.getByText("No active cycle")).toBeDefined();
  });

  it("Team Triage page shows 'No issues to triage'", () => {
    render(<TeamTriagePage />);
    expect(screen.getByText("No issues to triage")).toBeDefined();
    expect(screen.getByText("Create triage issue")).toBeDefined();
  });

  it("Projects page shows 'No projects' with create CTA", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ projects: [] }),
    });
    render(<ProjectsPage />);
    expect(
      await screen.findByText("No projects", {}, { timeout: 2000 }),
    ).toBeDefined();
    expect(screen.getByText("Create project")).toBeDefined();
  });

  it("Inbox page shows 'You're all caught up'", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: [] }),
    }) as unknown as typeof fetch;
    render(<InboxPage />);
    expect(
      await screen.findByText("You're all caught up", {}, { timeout: 2000 }),
    ).toBeDefined();
  });

  it("My Issues page shows 'No issues assigned'", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          groups: [],
          totalCount: 0,
          filterOptions: {
            statuses: [],
            assignees: [],
            labels: [],
            priorities: [],
          },
        }),
    }) as unknown as typeof fetch;
    render(<MyIssuesTabPage />);
    expect(
      await screen.findByText("No issues assigned", {}, { timeout: 2000 }),
    ).toBeDefined();
  });

  it("Initiatives page shows 'No initiatives'", () => {
    render(<InitiativesPage />);
    expect(screen.getByText("No initiatives")).toBeDefined();
  });
});
