import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FilterBar,
  type FilterCondition,
  type FilterType,
  applyFilters,
} from "@/components/filter-bar";

afterEach(cleanup);

describe("FilterBar", () => {
  const defaultProps = {
    filters: [] as FilterCondition[],
    onFiltersChange: vi.fn(),
    availableStatuses: [
      { id: "s1", name: "Backlog", category: "backlog", color: "#666" },
      { id: "s2", name: "In Progress", category: "started", color: "#f0c" },
      { id: "s3", name: "Done", category: "completed", color: "#0f0" },
    ],
    availableLabels: [
      { id: "l1", name: "Bug", color: "#ff0000" },
      { id: "l2", name: "Feature", color: "#00ff00" },
    ],
    availableAssignees: [
      { id: "u1", name: "Alice" },
      { id: "u2", name: "Bob" },
    ],
    availablePriorities: [
      { value: "urgent", label: "Urgent" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
      { value: "none", label: "No priority" },
    ],
  };

  it("renders Add Filter button", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Filter")).toBeDefined();
  });

  it("shows filter type menu when Add Filter clicked", () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getByText("Filter"));
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Priority")).toBeDefined();
    expect(screen.getByText("Assignee")).toBeDefined();
    expect(screen.getByText("Label")).toBeDefined();
  });

  it("shows status options when Status filter type selected", () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Status"));
    expect(screen.getByText("Backlog")).toBeDefined();
    expect(screen.getByText("In Progress")).toBeDefined();
    expect(screen.getByText("Done")).toBeDefined();
  });

  it("adds a status filter when status option clicked", () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Status"));
    fireEvent.click(screen.getByText("Backlog"));
    expect(onFiltersChange).toHaveBeenCalledWith([
      { type: "status", operator: "is", values: ["s1"] },
    ]);
  });

  it("shows priority options when Priority filter type selected", () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Priority"));
    expect(screen.getByText("Urgent")).toBeDefined();
    expect(screen.getByText("High")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
    expect(screen.getByText("Low")).toBeDefined();
  });

  it("adds a priority filter when priority option clicked", () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Priority"));
    fireEvent.click(screen.getByText("Urgent"));
    expect(onFiltersChange).toHaveBeenCalledWith([
      { type: "priority", operator: "is", values: ["urgent"] },
    ]);
  });

  it("shows assignee options when Assignee filter type selected", () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Assignee"));
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
  });

  it("shows label options when Label filter type selected", () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.click(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Label"));
    expect(screen.getByText("Bug")).toBeDefined();
    expect(screen.getByText("Feature")).toBeDefined();
  });

  it("renders active filter chips", () => {
    const filters: FilterCondition[] = [
      { type: "status", operator: "is", values: ["s1"] },
      { type: "priority", operator: "is", values: ["high"] },
    ];
    render(<FilterBar {...defaultProps} filters={filters} />);
    // Filter chips contain the type label as secondary text
    const allText = document.body.textContent ?? "";
    expect(allText).toContain("Status");
    expect(allText).toContain("Priority");
  });

  it("removes a filter when chip X button clicked", () => {
    const onFiltersChange = vi.fn();
    const filters: FilterCondition[] = [
      { type: "status", operator: "is", values: ["s1"] },
    ];
    render(
      <FilterBar
        {...defaultProps}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    );
    const removeButtons = screen.getAllByLabelText("Remove filter");
    fireEvent.click(removeButtons[0]);
    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });

  it("renders clear all button when filters are active", () => {
    const onFiltersChange = vi.fn();
    const filters: FilterCondition[] = [
      { type: "status", operator: "is", values: ["s1"] },
    ];
    render(
      <FilterBar
        {...defaultProps}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    );
    const clearBtn = screen.getByText("Clear");
    fireEvent.click(clearBtn);
    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });

  it("does not render clear all button when no filters active", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.queryByText("Clear")).toBeNull();
  });

  it("adds multiple values to same filter type", () => {
    const onFiltersChange = vi.fn();
    const filters: FilterCondition[] = [
      { type: "status", operator: "is", values: ["s1"] },
    ];
    render(
      <FilterBar
        {...defaultProps}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />,
    );
    fireEvent.click(screen.getByText("Filter"));
    // "Status" appears in both the chip and the menu — use getAllByText and pick the menu item
    const statusItems = screen.getAllByText("Status");
    // The last one is in the filter type menu
    fireEvent.click(statusItems[statusItems.length - 1]);
    fireEvent.click(screen.getByText("In Progress"));
    expect(onFiltersChange).toHaveBeenCalledWith([
      { type: "status", operator: "is", values: ["s1", "s2"] },
    ]);
  });

  it("displays resolved filter value labels in chips", () => {
    const filters: FilterCondition[] = [
      { type: "status", operator: "is", values: ["s1"] },
    ];
    render(<FilterBar {...defaultProps} filters={filters} />);
    expect(screen.getByText("Backlog")).toBeDefined();
  });

  it("supports label filter with color dots", () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar {...defaultProps} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByText("Filter"));
    fireEvent.click(screen.getByText("Label"));
    fireEvent.click(screen.getByText("Bug"));
    expect(onFiltersChange).toHaveBeenCalledWith([
      { type: "label", operator: "is", values: ["l1"] },
    ]);
  });
});

describe("FilterBar - applyFilters utility", () => {
  const mockIssues = [
    {
      id: "i1",
      stateId: "s1",
      priority: "urgent",
      assigneeId: "u1",
      labelIds: ["l1"],
      projectId: "p1",
    },
    {
      id: "i2",
      stateId: "s2",
      priority: "high",
      assigneeId: "u2",
      labelIds: ["l2"],
      projectId: null,
    },
    {
      id: "i3",
      stateId: "s1",
      priority: "none",
      assigneeId: null,
      labelIds: [],
      projectId: "p1",
    },
  ];

  it("returns all issues when no filters", () => {
    const result = applyFilters(mockIssues, []);
    expect(result).toHaveLength(3);
  });

  it("filters by status", () => {
    const result = applyFilters(mockIssues, [
      { type: "status", operator: "is", values: ["s1"] },
    ]);
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.stateId === "s1")).toBe(true);
  });

  it("filters by priority", () => {
    const result = applyFilters(mockIssues, [
      { type: "priority", operator: "is", values: ["urgent"] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("i1");
  });

  it("filters by assignee", () => {
    const result = applyFilters(mockIssues, [
      { type: "assignee", operator: "is", values: ["u1"] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("i1");
  });

  it("filters by label", () => {
    const result = applyFilters(mockIssues, [
      { type: "label", operator: "is", values: ["l1"] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("i1");
  });

  it("applies multiple filters with AND logic", () => {
    const result = applyFilters(mockIssues, [
      { type: "status", operator: "is", values: ["s1"] },
      { type: "priority", operator: "is", values: ["urgent"] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("i1");
  });

  it("supports isNot operator", () => {
    const result = applyFilters(mockIssues, [
      { type: "status", operator: "isNot", values: ["s1"] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("i2");
  });

  it("filters by multiple values in same filter (OR within filter)", () => {
    const result = applyFilters(mockIssues, [
      { type: "priority", operator: "is", values: ["urgent", "high"] },
    ]);
    expect(result).toHaveLength(2);
  });
});
