import {
  findAuthorizedCommentRef,
  findAuthorizedIssueRef,
  findAuthorizedLabelRef,
  validateIssueCreateRefs,
} from "@/lib/api-authz";
import { db } from "@/lib/db";
import {
  comment,
  issue,
  issueLabel,
  label,
  member,
  project,
  team,
  user,
  workflowState,
  workspace,
} from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const TEST_USER_A_ID = "authz-db-user-a";
const TEST_USER_B_ID = "authz-db-user-b";
const TEST_WORKSPACE_A_ID = "21000000-0000-4000-8000-000000000001";
const TEST_WORKSPACE_B_ID = "21000000-0000-4000-8000-000000000002";
const TEST_TEAM_A_ID = "21000000-0000-4000-8000-000000000003";
const TEST_TEAM_B_ID = "21000000-0000-4000-8000-000000000004";
const TEST_STATE_A_ID = "21000000-0000-4000-8000-000000000005";
const TEST_STATE_B_ID = "21000000-0000-4000-8000-000000000006";
const TEST_ISSUE_A_ID = "21000000-0000-4000-8000-000000000007";
const TEST_ISSUE_B_ID = "21000000-0000-4000-8000-000000000008";
const TEST_COMMENT_B_ID = "21000000-0000-4000-8000-000000000009";
const TEST_LABEL_A_ID = "21000000-0000-4000-8000-000000000010";
const TEST_LABEL_B_ID = "21000000-0000-4000-8000-000000000011";
const TEST_PROJECT_B_ID = "21000000-0000-4000-8000-000000000012";

const cookieState = vi.hoisted(() => ({
  activeWorkspaceId: "21000000-0000-4000-8000-000000000001",
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) =>
      name === "activeWorkspaceId"
        ? { value: cookieState.activeWorkspaceId }
        : undefined,
    ),
  })),
}));

async function cleanupAuthzFixture() {
  await db
    .delete(issueLabel)
    .where(inArray(issueLabel.issueId, [TEST_ISSUE_A_ID, TEST_ISSUE_B_ID]));
  await db.delete(comment).where(inArray(comment.id, [TEST_COMMENT_B_ID]));
  await db
    .delete(issue)
    .where(inArray(issue.id, [TEST_ISSUE_A_ID, TEST_ISSUE_B_ID]));
  await db
    .delete(label)
    .where(inArray(label.id, [TEST_LABEL_A_ID, TEST_LABEL_B_ID]));
  await db.delete(project).where(inArray(project.id, [TEST_PROJECT_B_ID]));
  await db
    .delete(workflowState)
    .where(inArray(workflowState.id, [TEST_STATE_A_ID, TEST_STATE_B_ID]));
  await db
    .delete(team)
    .where(inArray(team.id, [TEST_TEAM_A_ID, TEST_TEAM_B_ID]));
  await db
    .delete(member)
    .where(inArray(member.userId, [TEST_USER_A_ID, TEST_USER_B_ID]));
  await db
    .delete(workspace)
    .where(inArray(workspace.id, [TEST_WORKSPACE_A_ID, TEST_WORKSPACE_B_ID]));
  await db
    .delete(user)
    .where(inArray(user.id, [TEST_USER_A_ID, TEST_USER_B_ID]));
}

describe("api authz helpers tenant isolation", () => {
  beforeAll(async () => {
    await cleanupAuthzFixture();

    await db.insert(user).values([
      {
        id: TEST_USER_A_ID,
        name: "Authz DB User A",
        email: "authz-db-user-a@example.com",
      },
      {
        id: TEST_USER_B_ID,
        name: "Authz DB User B",
        email: "authz-db-user-b@example.com",
      },
    ]);

    await db.insert(workspace).values([
      {
        id: TEST_WORKSPACE_A_ID,
        name: "Authz DB Workspace A",
        urlSlug: "authz-db-a",
      },
      {
        id: TEST_WORKSPACE_B_ID,
        name: "Authz DB Workspace B",
        urlSlug: "authz-db-b",
      },
    ]);

    await db.insert(member).values([
      {
        userId: TEST_USER_A_ID,
        workspaceId: TEST_WORKSPACE_A_ID,
        role: "admin",
      },
      {
        userId: TEST_USER_B_ID,
        workspaceId: TEST_WORKSPACE_B_ID,
        role: "admin",
      },
    ]);

    await db.insert(team).values([
      {
        id: TEST_TEAM_A_ID,
        workspaceId: TEST_WORKSPACE_A_ID,
        name: "Authz DB Team A",
        key: "AZA",
      },
      {
        id: TEST_TEAM_B_ID,
        workspaceId: TEST_WORKSPACE_B_ID,
        name: "Authz DB Team B",
        key: "AZB",
      },
    ]);

    await db.insert(workflowState).values([
      {
        id: TEST_STATE_A_ID,
        teamId: TEST_TEAM_A_ID,
        name: "Backlog",
        category: "backlog",
        position: 1,
      },
      {
        id: TEST_STATE_B_ID,
        teamId: TEST_TEAM_B_ID,
        name: "Backlog",
        category: "backlog",
        position: 1,
      },
    ]);

    await db.insert(label).values([
      {
        id: TEST_LABEL_A_ID,
        name: "Workspace A Label",
        workspaceId: TEST_WORKSPACE_A_ID,
      },
      {
        id: TEST_LABEL_B_ID,
        name: "Workspace B Label",
        workspaceId: TEST_WORKSPACE_B_ID,
      },
    ]);

    await db.insert(project).values({
      id: TEST_PROJECT_B_ID,
      name: "Workspace B Project",
      slug: "workspace-b-project",
      workspaceId: TEST_WORKSPACE_B_ID,
    });

    await db.insert(issue).values([
      {
        id: TEST_ISSUE_A_ID,
        number: 1,
        identifier: "AZA-1",
        title: "Workspace A issue",
        teamId: TEST_TEAM_A_ID,
        stateId: TEST_STATE_A_ID,
        creatorId: TEST_USER_A_ID,
      },
      {
        id: TEST_ISSUE_B_ID,
        number: 1,
        identifier: "AZB-1",
        title: "Workspace B issue",
        teamId: TEST_TEAM_B_ID,
        stateId: TEST_STATE_B_ID,
        creatorId: TEST_USER_B_ID,
      },
    ]);

    await db.insert(comment).values({
      id: TEST_COMMENT_B_ID,
      issueId: TEST_ISSUE_B_ID,
      userId: TEST_USER_B_ID,
      body: "foreign workspace comment",
    });
  });

  afterAll(async () => {
    await cleanupAuthzFixture();
  });

  it("authorizes active-workspace issues and denies foreign issue ids and identifiers", async () => {
    cookieState.activeWorkspaceId = TEST_WORKSPACE_A_ID;

    await expect(
      findAuthorizedIssueRef(TEST_ISSUE_A_ID, TEST_USER_A_ID),
    ).resolves.toMatchObject({
      id: TEST_ISSUE_A_ID,
      teamId: TEST_TEAM_A_ID,
      workspaceId: TEST_WORKSPACE_A_ID,
    });
    await expect(
      findAuthorizedIssueRef("AZA-1", TEST_USER_A_ID),
    ).resolves.toMatchObject({
      id: TEST_ISSUE_A_ID,
      teamId: TEST_TEAM_A_ID,
      workspaceId: TEST_WORKSPACE_A_ID,
    });

    await expect(
      findAuthorizedIssueRef(TEST_ISSUE_B_ID, TEST_USER_A_ID),
    ).resolves.toBeNull();
    await expect(
      findAuthorizedIssueRef("AZB-1", TEST_USER_A_ID),
    ).resolves.toBeNull();
  });

  it("denies foreign comments and labels through active-workspace scoped helpers", async () => {
    cookieState.activeWorkspaceId = TEST_WORKSPACE_A_ID;

    await expect(
      findAuthorizedCommentRef(TEST_COMMENT_B_ID, TEST_USER_A_ID),
    ).resolves.toBeNull();
    await expect(
      findAuthorizedLabelRef(TEST_LABEL_B_ID, TEST_USER_A_ID),
    ).resolves.toBeNull();
  });

  it("rejects issue-create refs that point outside the authorized team/workspace", async () => {
    cookieState.activeWorkspaceId = TEST_WORKSPACE_A_ID;
    const authorizedTeam = {
      id: TEST_TEAM_A_ID,
      key: "AZA",
      name: "Authz DB Team A",
      workspaceId: TEST_WORKSPACE_A_ID,
    };

    await expect(
      validateIssueCreateRefs({ stateId: TEST_STATE_B_ID }, authorizedTeam),
    ).resolves.toEqual({ ok: false, error: "Workflow state not found" });
    await expect(
      validateIssueCreateRefs({ labelIds: [TEST_LABEL_B_ID] }, authorizedTeam),
    ).resolves.toEqual({ ok: false, error: "Labels are invalid" });
    await expect(
      validateIssueCreateRefs(
        { parentIssueId: TEST_ISSUE_B_ID },
        authorizedTeam,
      ),
    ).resolves.toEqual({ ok: false, error: "Parent issue not found" });
    await expect(
      validateIssueCreateRefs({ projectId: TEST_PROJECT_B_ID }, authorizedTeam),
    ).resolves.toEqual({ ok: false, error: "Project not found" });
    await expect(
      validateIssueCreateRefs({ assigneeId: TEST_USER_B_ID }, authorizedTeam),
    ).resolves.toEqual({ ok: false, error: "Assignee not found" });
  });
});
