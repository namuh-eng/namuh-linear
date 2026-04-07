import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ slug: "agent-speed" }),
}));

import { MilestoneRow } from "@/components/milestone-row";
import { ProjectProperties } from "@/components/project-properties";

afterEach(cleanup);

describe("ProjectProperties", () => {
  const defaultProps = {
    status: "planned" as const,
    priority: "high" as const,
    lead: null as { name: string; image?: string } | null,
    members: [] as { name: string; image?: string }[],
    startDate: null as string | null,
    targetDate: null as string | null,
    teams: [] as { name: string; key: string }[],
    labels: [] as { name: string; color: string }[],
  };

  it("renders status property", () => {
    render(<ProjectProperties {...defaultProps} />);
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Planned")).toBeDefined();
  });

  it("renders priority property", () => {
    render(<ProjectProperties {...defaultProps} />);
    expect(screen.getByText("Priority")).toBeDefined();
    expect(screen.getByText("High")).toBeDefined();
  });

  it("renders lead when provided", () => {
    render(<ProjectProperties {...defaultProps} lead={{ name: "Alice" }} />);
    expect(screen.getByText("Lead")).toBeDefined();
    expect(screen.getByText("Alice")).toBeDefined();
  });

  it("shows 'Add lead' when no lead", () => {
    render(<ProjectProperties {...defaultProps} />);
    expect(screen.getByText("Add lead")).toBeDefined();
  });

  it("renders team names", () => {
    render(
      <ProjectProperties
        {...defaultProps}
        teams={[{ name: "Engineering", key: "ENG" }]}
      />,
    );
    expect(screen.getByText("Teams")).toBeDefined();
    expect(screen.getByText("Engineering")).toBeDefined();
  });

  it("renders dates section", () => {
    render(
      <ProjectProperties
        {...defaultProps}
        startDate="2026-01-01T00:00:00Z"
        targetDate="2026-06-01T00:00:00Z"
      />,
    );
    expect(screen.getByText("Dates")).toBeDefined();
    expect(screen.getByText(/Jan 1/)).toBeDefined();
  });

  it("renders labels", () => {
    render(
      <ProjectProperties
        {...defaultProps}
        labels={[{ name: "Frontend", color: "#ff0000" }]}
      />,
    );
    expect(screen.getByText("Labels")).toBeDefined();
    expect(screen.getByText("Frontend")).toBeDefined();
  });

  it("shows 'Add label' when no labels", () => {
    render(<ProjectProperties {...defaultProps} />);
    expect(screen.getByText("Add label")).toBeDefined();
  });
});

describe("MilestoneRow", () => {
  it("renders milestone name", () => {
    render(
      <MilestoneRow
        name="Tier 1: Quick Wins"
        progress={100}
        issueCount={2}
        completedCount={2}
      />,
    );
    expect(screen.getByText("Tier 1: Quick Wins")).toBeDefined();
  });

  it("renders progress percentage", () => {
    render(
      <MilestoneRow
        name="Tier 2"
        progress={50}
        issueCount={4}
        completedCount={2}
      />,
    );
    expect(screen.getByText("50%")).toBeDefined();
  });

  it("renders issue count", () => {
    render(
      <MilestoneRow
        name="Tier 3"
        progress={0}
        issueCount={5}
        completedCount={0}
      />,
    );
    expect(screen.getByText(/of 5/)).toBeDefined();
  });

  it("renders progress bar", () => {
    render(
      <MilestoneRow
        name="Tier 1"
        progress={75}
        issueCount={4}
        completedCount={3}
      />,
    );
    expect(screen.getByTestId("milestone-progress-bar")).toBeDefined();
  });
});
