import { DisplayOptionsPanel } from "@/components/display-options-panel";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
});

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  layout: "list" as const,
  onLayoutChange: vi.fn(),
  displayProperties: {
    id: true,
    status: true,
    assignee: true,
    priority: true,
    project: false,
    dueDate: false,
    milestone: false,
    labels: true,
    links: false,
    timeInStatus: false,
    created: false,
    updated: false,
    pullRequests: false,
  },
  onDisplayPropertyToggle: vi.fn(),
  showSubIssues: true,
  onShowSubIssuesToggle: vi.fn(),
  showTriageIssues: false,
  onShowTriageIssuesToggle: vi.fn(),
  showEmptyColumns: false,
  onShowEmptyColumnsToggle: vi.fn(),
};

describe("DisplayOptionsPanel", () => {
  it("renders when open", () => {
    render(<DisplayOptionsPanel {...defaultProps} />);
    expect(screen.getByText("Columns")).toBeDefined();
  });

  it("does not render when closed", () => {
    render(<DisplayOptionsPanel {...defaultProps} open={false} />);
    expect(screen.queryByText("Columns")).toBeNull();
  });

  it("renders List and Board layout tabs", () => {
    render(<DisplayOptionsPanel {...defaultProps} />);
    expect(screen.getByText("List")).toBeDefined();
    expect(screen.getByText("Board")).toBeDefined();
  });

  it("highlights active layout", () => {
    const { container } = render(<DisplayOptionsPanel {...defaultProps} />);
    const listBtn = screen.getByText("List").closest("button");
    expect(listBtn?.className).toContain("bg-");
  });

  it("calls onLayoutChange when switching layout", () => {
    const onLayoutChange = vi.fn();
    render(
      <DisplayOptionsPanel {...defaultProps} onLayoutChange={onLayoutChange} />,
    );
    fireEvent.click(screen.getByText("Board"));
    expect(onLayoutChange).toHaveBeenCalledWith("board");
  });

  it("renders display property chips", () => {
    render(<DisplayOptionsPanel {...defaultProps} />);
    expect(screen.getByText("ID")).toBeDefined();
    expect(screen.getByText("Assignee")).toBeDefined();
    expect(screen.getAllByText("Priority").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Labels")).toBeDefined();
    expect(screen.getByText("Project")).toBeDefined();
    expect(screen.getByText("Due date")).toBeDefined();
    expect(screen.getByText("Milestone")).toBeDefined();
  });

  it("calls onDisplayPropertyToggle when clicking a property", () => {
    const onToggle = vi.fn();
    render(
      <DisplayOptionsPanel
        {...defaultProps}
        onDisplayPropertyToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByText("Project"));
    expect(onToggle).toHaveBeenCalledWith("project");
  });

  it("renders Show sub-issues toggle", () => {
    render(<DisplayOptionsPanel {...defaultProps} />);
    expect(screen.getByText("Show sub-issues")).toBeDefined();
  });

  it("renders Show triage issues toggle", () => {
    render(<DisplayOptionsPanel {...defaultProps} />);
    expect(screen.getByText("Show triage issues")).toBeDefined();
  });

  it("renders Board options section", () => {
    render(<DisplayOptionsPanel {...defaultProps} />);
    expect(screen.getByText("Board options")).toBeDefined();
    expect(screen.getByText("Show empty columns")).toBeDefined();
  });

  it("renders Ordering row", () => {
    render(<DisplayOptionsPanel {...defaultProps} />);
    expect(screen.getByText("Ordering")).toBeDefined();
  });

  it("renders Reset button", () => {
    render(<DisplayOptionsPanel {...defaultProps} />);
    expect(screen.getByText("Reset")).toBeDefined();
  });
});
