import { normalizeViewFilterState } from "@/lib/views";
import { describe, expect, it } from "vitest";

describe("normalizeViewFilterState", () => {
  it("keeps richer issue view filters and display options", () => {
    const normalized = normalizeViewFilterState(
      {
        entityType: "issues",
        scope: "team",
        issueFilters: [{ type: "priority", operator: "is", values: ["high"] }],
        issueDisplayOptions: {
          groupBy: "priority",
          subGroupBy: "assignee",
          orderBy: "created",
          displayProperties: { assignee: false, dueDate: true },
          showSubIssues: false,
          showTriageIssues: true,
          showEmptyColumns: true,
          timelineBy: "updated",
        },
      },
      "team-1",
    );

    expect(normalized.issueFilters).toEqual([
      { type: "priority", operator: "is", values: ["high"] },
    ]);
    expect(normalized.issueDisplayOptions).toMatchObject({
      groupBy: "priority",
      subGroupBy: "assignee",
      orderBy: "created",
      showSubIssues: false,
      showTriageIssues: true,
      showEmptyColumns: true,
      timelineBy: "updated",
    });
    expect(normalized.issueDisplayOptions.displayProperties.assignee).toBe(
      false,
    );
    expect(normalized.issueDisplayOptions.displayProperties.status).toBe(true);
  });

  it("defaults old saved views without display fields", () => {
    const normalized = normalizeViewFilterState(
      { entityType: "issues", issueFilters: [] },
      "team-1",
    );

    expect(normalized.issueDisplayOptions).toMatchObject({
      groupBy: "status",
      subGroupBy: "none",
      orderBy: "priority",
      showSubIssues: true,
      timelineBy: "dueDate",
    });
    expect(normalized.projectDisplayOptions).toMatchObject({
      groupBy: "status",
      showTeam: true,
      showLead: true,
      showTargetDate: true,
      showProgress: true,
    });
  });
});
