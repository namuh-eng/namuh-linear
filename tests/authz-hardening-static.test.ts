import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFileSync(join(root, path), "utf8");
const filesUnder = (path: string): string[] => {
  const absolutePath = join(root, path);
  return readdirSync(absolutePath).flatMap((entry) => {
    const child = join(path, entry);
    const stats = statSync(join(root, child));
    return stats.isDirectory() ? filesUnder(child) : [child];
  });
};

describe("authz hardening static regression", () => {
  it("keeps the workspace-switch exception helper limited to the context route", () => {
    const apiAuthz = source("src/lib/api-authz.ts");
    const contextRoute = source("src/app/api/teams/[key]/context/route.ts");

    expect(apiAuthz).toContain("findTeamContextForWorkspaceSwitchOnly");
    expect(apiAuthz).toContain("Do not use this helper for data or");
    expect(contextRoute).toContain("findTeamContextForWorkspaceSwitchOnly");

    const importingApiRoutes = filesUnder("src/app/api").filter((path) =>
      source(path).includes("findTeamContextForWorkspaceSwitchOnly"),
    );
    expect(importingApiRoutes).toEqual([
      "src/app/api/teams/[key]/context/route.ts",
    ]);
  });

  it("validates issue create cross-resource refs before numbering or inserts", () => {
    const route = source("src/app/api/issues/route.ts");

    expect(route.indexOf("validateIssueCreateRefs")).toBeLessThan(
      route.indexOf("select({ maxNum"),
    );
    expect(route.indexOf("validateIssueCreateRefs")).toBeLessThan(
      route.indexOf("db.transaction"),
    );
    expect(route).toContain("findAccessibleTeamById(teamId, session.user.id)");
  });

  it("scopes raw issue/comment/cycle mutations with authorized team or comment refs", () => {
    const issueDetail = source("src/app/api/issues/[id]/route.ts");
    expect(issueDetail).toContain("findAuthorizedIssueRef");
    expect(issueDetail).toContain("eq(issue.id, existingIssue.id)");
    expect(issueDetail).toContain("eq(issue.teamId, existingIssue.teamId)");

    const commentDetail = source("src/app/api/comments/[id]/route.ts");
    expect(commentDetail).toContain("findAuthorizedCommentRef");
    expect(commentDetail.indexOf("findAuthorizedCommentRef")).toBeLessThan(
      commentDetail.indexOf("deleteFile"),
    );
    expect(commentDetail).toContain("commentRef.userId !== session.user.id");

    const cycleDetail = source(
      "src/app/api/teams/[key]/cycles/[cycleId]/route.ts",
    );
    expect(cycleDetail).toContain("select({ id: cycle.id })");
    expect(cycleDetail.indexOf("select({ id: cycle.id })")).toBeLessThan(
      cycleDetail.indexOf("update(issue)"),
    );
    expect(cycleDetail).toContain("eq(issue.cycleId, cycleId)");
    expect(cycleDetail).toContain("eq(issue.teamId, teamId)");
  });

  it("removes issue search workspaceId query bypass handling", () => {
    const searchRoute = source("src/app/api/issues/search/route.ts");

    expect(searchRoute).not.toContain('searchParams.get("workspaceId")');
    expect(searchRoute).not.toContain("requestedWorkspaceId");
    expect(searchRoute).toContain("resolveActiveWorkspaceRef(session.user.id)");
  });
});
