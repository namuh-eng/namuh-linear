import { db } from "@/lib/db";
import { member, notification, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type NotificationType = (typeof notification.$inferInsert)["type"];

interface MentionCandidate {
  userId: string;
  email: string | null;
  name: string | null;
}

interface NotificationInput {
  actorId: string;
  issueId: string;
  type: NotificationType;
  userId: string;
}

const mentionPattern = /(^|\s)@([a-z0-9][\w.-]*)/gi;

function normalizeMentionToken(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

function getMentionAliases(candidate: MentionCandidate) {
  const aliases = new Set<string>();
  const trimmedName = candidate.name?.trim() ?? "";

  if (trimmedName) {
    aliases.add(normalizeMentionToken(trimmedName));

    for (const part of trimmedName.split(/\s+/)) {
      const normalizedPart = normalizeMentionToken(part);
      if (normalizedPart) {
        aliases.add(normalizedPart);
      }
    }
  }

  const emailLocalPart = candidate.email?.split("@")[0] ?? "";
  const normalizedEmailLocalPart = normalizeMentionToken(emailLocalPart);
  if (normalizedEmailLocalPart) {
    aliases.add(normalizedEmailLocalPart);
  }

  return aliases;
}

export function extractMentionTokens(value: string) {
  const matches = value.matchAll(mentionPattern);
  const tokens = new Set<string>();

  for (const match of matches) {
    const token = normalizeMentionToken(match[2] ?? "");
    if (token) {
      tokens.add(token);
    }
  }

  return [...tokens];
}

export const extractMentionHandles = extractMentionTokens;

export function resolveMentionedUserIdsFromCandidates(
  body: string,
  candidates: MentionCandidate[],
) {
  const tokens = extractMentionTokens(body);
  if (tokens.length === 0) {
    return [];
  }

  const remaining = new Set(tokens);
  const mentionedUserIds = new Set<string>();

  for (const candidate of candidates) {
    const aliases = getMentionAliases(candidate);
    for (const token of remaining) {
      if (!aliases.has(token)) {
        continue;
      }

      mentionedUserIds.add(candidate.userId);
      remaining.delete(token);
    }

    if (remaining.size === 0) {
      break;
    }
  }

  return [...mentionedUserIds];
}

export function buildNotificationValues(input: {
  actorId: string;
  issueId: string;
  type: NotificationType;
  userIds: Array<string | null | undefined>;
}) {
  const userIds = new Set(
    input.userIds.filter((value): value is string => Boolean(value)),
  );

  return [...userIds].map((userId) => ({
    actorId: input.actorId,
    issueId: input.issueId,
    type: input.type,
    userId,
  }));
}

export async function insertNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) {
    return;
  }

  await db.insert(notification).values(
    inputs.map((input) => ({
      actorId: input.actorId,
      issueId: input.issueId,
      type: input.type,
      userId: input.userId,
    })),
  );
}

async function getMentionCandidates(workspaceId: string) {
  return db
    .select({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.workspaceId, workspaceId));
}

export async function resolveMentionedUserIds(input: {
  body: string;
  workspaceId: string;
}) {
  const candidates = await getMentionCandidates(input.workspaceId);
  return resolveMentionedUserIdsFromCandidates(input.body, candidates);
}

export async function createAssignmentNotification(input: {
  actorId: string;
  assigneeId: string | null;
  issueId: string;
}) {
  if (!input.assigneeId) {
    return;
  }

  await insertNotifications([
    {
      actorId: input.actorId,
      issueId: input.issueId,
      type: "assigned",
      userId: input.assigneeId,
    },
  ]);
}

export async function createStatusChangeNotifications(input: {
  actorId: string;
  assigneeId: string | null;
  creatorId: string;
  issueId: string;
}) {
  const recipientIds = new Set(
    [input.assigneeId, input.creatorId].filter((value): value is string =>
      Boolean(value),
    ),
  );

  await insertNotifications(
    [...recipientIds].map((userId) => ({
      actorId: input.actorId,
      issueId: input.issueId,
      type: "status_change" as const,
      userId,
    })),
  );
}

export async function createCommentNotifications(input: {
  actorId: string;
  assigneeId: string | null;
  body: string;
  creatorId: string;
  issueId: string;
  workspaceId: string;
}) {
  const candidates = await getMentionCandidates(input.workspaceId);
  const mentionedUserIds = new Set(
    resolveMentionedUserIdsFromCandidates(input.body, candidates),
  );
  const recipientIds = new Set(
    [input.assigneeId, input.creatorId, ...mentionedUserIds].filter(
      (value): value is string => Boolean(value),
    ),
  );

  await insertNotifications(
    [...recipientIds].map((userId) => ({
      actorId: input.actorId,
      issueId: input.issueId,
      type: mentionedUserIds.has(userId) ? ("mentioned" as const) : "comment",
      userId,
    })),
  );
}
