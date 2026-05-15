import { buildGeneratedDiscussionSummary } from "@/lib/discussion-summary";
import { describe, expect, it } from "vitest";

describe("buildGeneratedDiscussionSummary", () => {
  it("returns an empty state for no or short discussions", () => {
    expect(buildGeneratedDiscussionSummary([])).toMatchObject({
      text: null,
      generatedAt: null,
      sourceCommentCount: 0,
    });
    expect(
      buildGeneratedDiscussionSummary([
        {
          body: "Only one note so far",
          userName: "Ashley",
          createdAt: new Date("2026-05-15T10:00:00Z"),
        },
      ]),
    ).toMatchObject({ text: null, sourceCommentCount: 1 });
  });

  it("synthesizes decisions, blockers, and next steps from the full thread", () => {
    const summary = buildGeneratedDiscussionSummary([
      {
        body: "We decided to ship the API path first. The billing dependency is still blocking rollout.",
        userName: "Ashley",
        createdAt: new Date("2026-05-15T10:00:00Z"),
      },
      {
        body: "Next, Morgan will verify the migration and follow up with support.",
        userName: "Morgan",
        createdAt: new Date("2026-05-15T10:05:00Z"),
      },
      {
        body: "Customer confirms the workaround is acceptable until billing is resolved.",
        userName: "Riley",
        createdAt: new Date("2026-05-15T10:10:00Z"),
      },
    ]);

    expect(summary.text).toContain("Overview:");
    expect(summary.text).toContain("Decision/status:");
    expect(summary.text).toContain("Blockers/risks:");
    expect(summary.text).toContain("Next steps:");
    expect(summary.text).toContain("Ashley");
    expect(summary.text).toContain("Morgan");
    expect(summary.text).not.toMatch(/\d+ comments? from \d+ participants?/);
    expect(summary.sourceCommentCount).toBe(3);
    expect(summary.generatedAt).toEqual(expect.any(String));
  });

  it("regenerates against the latest comment content", () => {
    const before = buildGeneratedDiscussionSummary([
      {
        body: "We decided to ship the API path first.",
        userName: "Ashley",
        createdAt: new Date("2026-05-15T10:00:00Z"),
      },
      {
        body: "Next, Morgan will verify the migration.",
        userName: "Morgan",
        createdAt: new Date("2026-05-15T10:05:00Z"),
      },
    ]);
    const after = buildGeneratedDiscussionSummary([
      {
        body: "We decided to ship the API path first.",
        userName: "Ashley",
        createdAt: new Date("2026-05-15T10:00:00Z"),
      },
      {
        body: "Next, Morgan will verify the migration.",
        userName: "Morgan",
        createdAt: new Date("2026-05-15T10:05:00Z"),
      },
      {
        body: "Billing remains blocked, so Riley will follow up tomorrow.",
        userName: "Riley",
        createdAt: new Date("2026-05-15T10:15:00Z"),
      },
    ]);

    expect(before.sourceCommentCount).toBe(2);
    expect(after.sourceCommentCount).toBe(3);
    expect(after.text).toContain("Latest update: Riley");
    expect(after.text).toContain("Billing remains blocked");
  });
});
