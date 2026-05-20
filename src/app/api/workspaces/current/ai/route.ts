import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { member, workspace } from "@/lib/db/schema";
import {
  mergeWorkspaceAiSettings,
  readWorkspaceAiSettings,
  validateWorkspaceAiSettingsPatch,
} from "@/lib/workspace-ai-settings";
import { isWorkspaceAdminRole } from "@/lib/workspace-permissions";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function findWorkspaceSettings(userId: string) {
  const activeWorkspaceId = await resolveActiveWorkspaceId(userId);
  if (!activeWorkspaceId) {
    return null;
  }

  const [currentWorkspace] = await db
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

  return currentWorkspace ?? null;
}

function buildAiResponse(
  currentWorkspace: NonNullable<
    Awaited<ReturnType<typeof findWorkspaceSettings>>
  >,
) {
  const ai = readWorkspaceAiSettings(currentWorkspace.settings);
  const canManageSettings = isWorkspaceAdminRole(currentWorkspace.role);

  return {
    ai: {
      ...ai,
      canManageSettings,
      integrationBoundary:
        "Workspace AI and agent run toggles are enforced by /api/agent/runs. Workspace guidance is included in agent run prompt configuration with account and team guidance.",
    },
  };
}

export async function GET() {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const currentWorkspace = await findWorkspaceSettings(session.user.id);
  if (!currentWorkspace) {
    return NextResponse.json(
      { error: "No active workspace found" },
      { status: 404 },
    );
  }

  return NextResponse.json(buildAiResponse(currentWorkspace));
}

export async function PATCH(request: Request) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const currentWorkspace = await findWorkspaceSettings(session.user.id);
  if (!currentWorkspace) {
    return NextResponse.json(
      { error: "No active workspace found" },
      { status: 404 },
    );
  }

  if (!isWorkspaceAdminRole(currentWorkspace.role)) {
    return NextResponse.json(
      { error: "You do not have permission to manage workspace AI settings" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const validationError = validateWorkspaceAiSettingsPatch(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const settings = mergeWorkspaceAiSettings(currentWorkspace.settings, body);

  await db
    .update(workspace)
    .set({ settings, updatedAt: new Date() })
    .where(eq(workspace.id, currentWorkspace.id));

  return NextResponse.json(buildAiResponse({ ...currentWorkspace, settings }));
}
