import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { db } from "@/lib/db";
import {
  comment,
  issue,
  label,
  member,
  project,
  team,
  workflowState,
  workspace,
} from "@/lib/db/schema";
import { and, eq, inArray, isNull, or } from "drizzle-orm";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function optionalUuid(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") {
    return value === undefined ? undefined : null;
  }

  return isUuid(value) ? value : null;
}

export type ActiveWorkspaceRef = {
  workspaceId: string;
};

export type AuthorizedTeamRef = {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
};

export type AuthorizedIssueRef = {
  id: string;
  identifier: string;
  number: number;
  teamId: string;
  workspaceId: string;
  assigneeId: string | null;
  creatorId: string;
  stateId: string;
};

export type AuthorizedCommentRef = {
  id: string;
  issueId: string;
  teamId: string;
  workspaceId: string;
  userId: string;
};

export type AuthorizedLabelRef = {
  id: string;
  workspaceId: string | null;
  teamId: string | null;
};

export type TeamContextForWorkspaceSwitch = {
  workspaceName: string;
  workspaceId: string;
  teamId: string;
  teamName: string;
  teamKey: string;
};

export type IssueCreateRefsInput = {
  stateId?: unknown;
  labelIds?: unknown;
  parentIssueId?: unknown;
  projectId?: unknown;
  assigneeId?: unknown;
};

export type IssueCreateRefsResult =
  | {
      ok: true;
      stateId: string;
      labelIds: string[];
      parentIssueId: string | null;
      projectId: string | null;
      assigneeId: string | null;
    }
  | { ok: false; error: string };

export async function resolveActiveWorkspaceRef(
  userId: string,
): Promise<ActiveWorkspaceRef | null> {
  const workspaceId = await resolveActiveWorkspaceId(userId);
  if (!workspaceId) {
    return null;
  }

  const [workspaceMember] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.workspaceId, workspaceId)))
    .limit(1);

  if (!workspaceMember) {
    return null;
  }

  return { workspaceId };
}

export async function findAuthorizedIssueRef(
  idOrIdentifier: string,
  userId: string,
): Promise<AuthorizedIssueRef | null> {
  const activeWorkspace = await resolveActiveWorkspaceRef(userId);
  if (!activeWorkspace) {
    return null;
  }

  const selectIssueRef = () =>
    db
      .select({
        id: issue.id,
        identifier: issue.identifier,
        number: issue.number,
        teamId: issue.teamId,
        workspaceId: team.workspaceId,
        assigneeId: issue.assigneeId,
        creatorId: issue.creatorId,
        stateId: issue.stateId,
      })
      .from(issue)
      .innerJoin(team, eq(issue.teamId, team.id));

  const byIdentifier = await selectIssueRef()
    .where(
      and(
        eq(issue.identifier, idOrIdentifier),
        eq(team.workspaceId, activeWorkspace.workspaceId),
      ),
    )
    .limit(1);

  if (byIdentifier[0]) {
    return byIdentifier[0];
  }

  if (!isUuid(idOrIdentifier)) {
    return null;
  }

  const byId = await selectIssueRef()
    .where(
      and(
        eq(issue.id, idOrIdentifier),
        eq(team.workspaceId, activeWorkspace.workspaceId),
      ),
    )
    .limit(1);

  return byId[0] ?? null;
}

export async function findAuthorizedCommentRef(
  commentId: string,
  userId: string,
): Promise<AuthorizedCommentRef | null> {
  if (!isUuid(commentId)) {
    return null;
  }

  const activeWorkspace = await resolveActiveWorkspaceRef(userId);
  if (!activeWorkspace) {
    return null;
  }

  const [commentRecord] = await db
    .select({
      id: comment.id,
      issueId: comment.issueId,
      teamId: issue.teamId,
      workspaceId: team.workspaceId,
      userId: comment.userId,
    })
    .from(comment)
    .innerJoin(issue, eq(comment.issueId, issue.id))
    .innerJoin(team, eq(issue.teamId, team.id))
    .where(
      and(
        eq(comment.id, commentId),
        eq(team.workspaceId, activeWorkspace.workspaceId),
      ),
    )
    .limit(1);

  return commentRecord ?? null;
}

export async function findAuthorizedLabelRef(
  labelId: string,
  userId: string,
): Promise<AuthorizedLabelRef | null> {
  if (!isUuid(labelId)) {
    return null;
  }

  const activeWorkspace = await resolveActiveWorkspaceRef(userId);
  if (!activeWorkspace) {
    return null;
  }

  const [labelRecord] = await db
    .select({
      id: label.id,
      workspaceId: label.workspaceId,
      teamId: label.teamId,
    })
    .from(label)
    .where(
      and(
        eq(label.id, labelId),
        eq(label.workspaceId, activeWorkspace.workspaceId),
      ),
    )
    .limit(1);

  return labelRecord ?? null;
}

/**
 * Workspace-switching exception only. Do not use this helper for data or
 * mutation routes; normal resource access must be scoped to active workspace.
 */
export async function findTeamContextForWorkspaceSwitchOnly(
  key: string,
  userId: string,
): Promise<TeamContextForWorkspaceSwitch | null> {
  const [context] = await db
    .select({
      workspaceName: workspace.name,
      workspaceId: workspace.id,
      teamId: team.id,
      teamName: team.name,
      teamKey: team.key,
    })
    .from(team)
    .innerJoin(workspace, eq(team.workspaceId, workspace.id))
    .innerJoin(
      member,
      and(eq(member.workspaceId, workspace.id), eq(member.userId, userId)),
    )
    .where(eq(team.key, key))
    .limit(1);

  return context ?? null;
}

export async function validateIssueCreateRefs(
  input: IssueCreateRefsInput,
  authorizedTeam: AuthorizedTeamRef,
): Promise<IssueCreateRefsResult> {
  const stateId = optionalUuid(input.stateId);
  if (stateId === null) {
    return { ok: false, error: "Workflow state not found" };
  }

  let finalStateId = stateId;
  if (finalStateId) {
    const [stateRecord] = await db
      .select({ id: workflowState.id })
      .from(workflowState)
      .where(
        and(
          eq(workflowState.id, finalStateId),
          eq(workflowState.teamId, authorizedTeam.id),
        ),
      )
      .limit(1);

    if (!stateRecord) {
      return { ok: false, error: "Workflow state not found" };
    }
  } else {
    const [defaultState] = await db
      .select({ id: workflowState.id })
      .from(workflowState)
      .where(
        and(
          eq(workflowState.teamId, authorizedTeam.id),
          eq(workflowState.category, "backlog"),
        ),
      )
      .limit(1);

    finalStateId = defaultState?.id;
  }

  if (!finalStateId) {
    return { ok: false, error: "No default workflow state found" };
  }

  const labelIds = Array.isArray(input.labelIds)
    ? [...new Set(input.labelIds.filter((value): value is string => !!value))]
    : [];

  if (labelIds.some((labelId) => !isUuid(labelId))) {
    return { ok: false, error: "Labels are invalid" };
  }

  if (labelIds.length > 0) {
    const labelRows = await db
      .select({ id: label.id })
      .from(label)
      .where(
        and(
          inArray(label.id, labelIds),
          eq(label.workspaceId, authorizedTeam.workspaceId),
          or(isNull(label.teamId), eq(label.teamId, authorizedTeam.id)),
        ),
      );

    if (labelRows.length !== labelIds.length) {
      return { ok: false, error: "Labels are invalid" };
    }
  }

  const parentIssueId = optionalUuid(input.parentIssueId);
  if (parentIssueId === null) {
    return { ok: false, error: "Parent issue not found" };
  }

  if (parentIssueId) {
    const [parentIssue] = await db
      .select({ id: issue.id })
      .from(issue)
      .where(
        and(eq(issue.id, parentIssueId), eq(issue.teamId, authorizedTeam.id)),
      )
      .limit(1);

    if (!parentIssue) {
      return { ok: false, error: "Parent issue not found" };
    }
  }

  const projectId = optionalUuid(input.projectId);
  if (projectId === null) {
    return { ok: false, error: "Project not found" };
  }

  if (projectId) {
    const [projectRecord] = await db
      .select({ id: project.id })
      .from(project)
      .where(
        and(
          eq(project.id, projectId),
          eq(project.workspaceId, authorizedTeam.workspaceId),
        ),
      )
      .limit(1);

    if (!projectRecord) {
      return { ok: false, error: "Project not found" };
    }
  }

  const assigneeId =
    input.assigneeId === undefined ||
    input.assigneeId === null ||
    input.assigneeId === ""
      ? null
      : typeof input.assigneeId === "string"
        ? input.assigneeId
        : undefined;

  if (assigneeId === undefined) {
    return { ok: false, error: "Assignee not found" };
  }

  if (assigneeId) {
    const [assigneeMember] = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.workspaceId, authorizedTeam.workspaceId),
          eq(member.userId, assigneeId),
        ),
      )
      .limit(1);

    if (!assigneeMember) {
      return { ok: false, error: "Assignee not found" };
    }
  }

  return {
    ok: true,
    stateId: finalStateId,
    labelIds,
    parentIssueId: parentIssueId ?? null,
    projectId: projectId ?? null,
    assigneeId,
  };
}
