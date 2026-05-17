import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { member, workspace } from "@/lib/db/schema";
import {
  MAX_WORKSPACE_AGENT_GUIDANCE_LENGTH,
  canUseWorkspaceAi,
  readWorkspaceAiSettings,
  serializeWorkspaceAiSettings,
} from "@/lib/workspace-ai-settings";
import {
  asRecord,
  isPermissionLevel,
  isWorkspaceAdminRole,
} from "@/lib/workspace-permissions";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type CurrentWorkspaceRecord = {
  id: string;
  settings: unknown;
  role: string;
};

async function findCurrentWorkspace(userId: string) {
  const activeWorkspaceId = await resolveActiveWorkspaceId(userId);
  if (!activeWorkspaceId) return null;

  const [record] = await db
    .select({
      id: workspace.id,
      settings: workspace.settings,
      role: member.role,
    })
    .from(workspace)
    .innerJoin(
      member,
      and(
        eq(member.workspaceId, workspace.id),
        eq(member.userId, userId),
        eq(member.workspaceId, activeWorkspaceId),
      ),
    )
    .limit(1);

  return (record as CurrentWorkspaceRecord | undefined) ?? null;
}

function buildResponse(currentWorkspace: CurrentWorkspaceRecord) {
  const ai = readWorkspaceAiSettings(currentWorkspace.settings);
  return {
    ai,
    capabilities: {
      canManageAiSettings: isWorkspaceAdminRole(currentWorkspace.role),
      canUseAiAgents: canUseWorkspaceAi(currentWorkspace.role, ai),
    },
  };
}

export async function GET() {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) return authResponse;

  const currentWorkspace = await findCurrentWorkspace(session.user.id);
  if (!currentWorkspace) {
    return NextResponse.json(
      { error: "No active workspace found" },
      { status: 404 },
    );
  }

  return NextResponse.json(buildResponse(currentWorkspace));
}

export async function PATCH(request: Request) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) return authResponse;

  const currentWorkspace = await findCurrentWorkspace(session.user.id);
  if (!currentWorkspace) {
    return NextResponse.json(
      { error: "No active workspace found" },
      { status: 404 },
    );
  }

  if (!isWorkspaceAdminRole(currentWorkspace.role)) {
    return NextResponse.json(
      { error: "Only workspace admins can manage AI settings" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const currentAi = readWorkspaceAiSettings(currentWorkspace.settings);
  const nextAi = { ...currentAi };

  for (const key of [
    "enabled",
    "issueSuggestions",
    "summaries",
    "autoTriage",
  ] as const) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "boolean") {
        return NextResponse.json(
          { error: `${key} must be a boolean` },
          { status: 400 },
        );
      }
      nextAi[key] = body[key];
    }
  }

  if (body.agentGuidance !== undefined) {
    if (typeof body.agentGuidance !== "string") {
      return NextResponse.json(
        { error: "Agent guidance must be text" },
        { status: 400 },
      );
    }
    if (body.agentGuidance.length > MAX_WORKSPACE_AGENT_GUIDANCE_LENGTH) {
      return NextResponse.json(
        {
          error: `Agent guidance must be ${MAX_WORKSPACE_AGENT_GUIDANCE_LENGTH} characters or fewer`,
        },
        { status: 400 },
      );
    }
    nextAi.agentGuidance = body.agentGuidance;
  }

  if (body.usagePermission !== undefined) {
    if (!isPermissionLevel(body.usagePermission)) {
      return NextResponse.json(
        { error: "AI usage permission must be admins, members, or anyone" },
        { status: 400 },
      );
    }
    nextAi.usagePermission = body.usagePermission;
  }

  const settings = {
    ...asRecord(currentWorkspace.settings),
    ai: serializeWorkspaceAiSettings(nextAi),
  };

  await db
    .update(workspace)
    .set({ settings, updatedAt: new Date() })
    .where(eq(workspace.id, currentWorkspace.id));

  return NextResponse.json(buildResponse({ ...currentWorkspace, settings }));
}
