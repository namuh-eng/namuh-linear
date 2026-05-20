import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { member, workspace } from "@/lib/db/schema";
import { isWorkspaceAdminRole } from "@/lib/workspace-permissions";
import {
  asRecord,
  mergeSamlSettings,
  readSamlSecuritySettings,
  serializeSamlSecuritySettings,
  testSamlSettings,
  validateSamlForSave,
} from "@/lib/workspace-saml-scim";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function findCurrentWorkspace(userId: string) {
  const activeWorkspaceId = await resolveActiveWorkspaceId(userId);
  if (!activeWorkspaceId) return null;

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

async function requireAdminWorkspace() {
  const { response, session } = await requireApiSession();
  if (response) return { response, currentWorkspace: null };

  const currentWorkspace = await findCurrentWorkspace(session.user.id);
  if (!currentWorkspace) {
    return {
      response: NextResponse.json(
        { error: "No active workspace found" },
        { status: 404 },
      ),
      currentWorkspace: null,
    };
  }

  if (!isWorkspaceAdminRole(currentWorkspace.role)) {
    return {
      response: NextResponse.json(
        { error: "You do not have permission to manage workspace security" },
        { status: 403 },
      ),
      currentWorkspace: null,
    };
  }

  return { response: null, currentWorkspace };
}

async function saveSamlSettings(
  currentWorkspace: NonNullable<
    Awaited<ReturnType<typeof findCurrentWorkspace>>
  >,
  saml: ReturnType<typeof readSamlSecuritySettings>,
) {
  const existingSettings = asRecord(currentWorkspace.settings);
  const settings = {
    ...existingSettings,
    security: {
      ...asRecord(existingSettings.security),
      saml: serializeSamlSecuritySettings(saml),
    },
  };

  await db
    .update(workspace)
    .set({ settings, updatedAt: new Date() })
    .where(eq(workspace.id, currentWorkspace.id));

  return settings;
}

export async function PATCH(request: Request) {
  const { response, currentWorkspace } = await requireAdminWorkspace();
  if (response || !currentWorkspace) return response;

  const body = (await request.json().catch(() => null)) as unknown;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validateSamlForSave(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const currentSaml = readSamlSecuritySettings(currentWorkspace.settings);
  const saml = mergeSamlSettings(currentSaml, body);
  await saveSamlSettings(currentWorkspace, saml);

  return NextResponse.json({ saml });
}

export async function POST(request: Request) {
  const { response, currentWorkspace } = await requireAdminWorkspace();
  if (response || !currentWorkspace) return response;

  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
  } | null;
  if (body?.action !== "test") {
    return NextResponse.json(
      { error: "Unsupported SAML action" },
      { status: 400 },
    );
  }

  const saml = testSamlSettings(
    readSamlSecuritySettings(currentWorkspace.settings),
  );
  await saveSamlSettings(currentWorkspace, saml);

  return NextResponse.json({ saml });
}
