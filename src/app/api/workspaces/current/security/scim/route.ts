import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { member, workspace } from "@/lib/db/schema";
import { isWorkspaceAdminRole } from "@/lib/workspace-permissions";
import {
  asRecord,
  createScimToken,
  readStoredScimSecuritySettings,
  safeScimSettings,
  serializeStoredScimSettings,
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

function scimBaseUrl(request: Request) {
  return `${new URL(request.url).origin}/api/scim/v2`;
}

async function saveScimSettings(
  currentWorkspace: NonNullable<
    Awaited<ReturnType<typeof findCurrentWorkspace>>
  >,
  scim: ReturnType<typeof readStoredScimSecuritySettings>,
) {
  const existingSettings = asRecord(currentWorkspace.settings);
  const settings = {
    ...existingSettings,
    security: {
      ...asRecord(existingSettings.security),
      scim: serializeStoredScimSettings(scim),
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

  const body = (await request.json().catch(() => null)) as {
    enabled?: unknown;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "SCIM enabled must be a boolean" },
      { status: 400 },
    );
  }

  const scim = readStoredScimSecuritySettings(
    currentWorkspace.settings,
    scimBaseUrl(request),
  );
  const nextScim = {
    ...scim,
    enabled: typeof body.enabled === "boolean" ? body.enabled : scim.enabled,
    status: body.enabled === true ? "enabled" : "disabled",
  } as const;
  await saveScimSettings(currentWorkspace, nextScim);

  return NextResponse.json({ scim: safeScimSettings(nextScim) });
}

export async function POST(request: Request) {
  const { response, currentWorkspace } = await requireAdminWorkspace();
  if (response || !currentWorkspace) return response;

  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    tokenId?: unknown;
    name?: unknown;
  } | null;
  if (!body || typeof body.action !== "string") {
    return NextResponse.json(
      { error: "Unsupported SCIM action" },
      { status: 400 },
    );
  }

  const scim = readStoredScimSecuritySettings(
    currentWorkspace.settings,
    scimBaseUrl(request),
  );

  if (body.action === "generate-token") {
    const { token, secret } = createScimToken(
      typeof body.name === "string" ? body.name : "SCIM token",
    );
    const nextScim = {
      ...scim,
      enabled: true,
      status: "enabled" as const,
      tokens: [...scim.tokens, token],
    };
    await saveScimSettings(currentWorkspace, nextScim);
    return NextResponse.json({
      scim: safeScimSettings(nextScim),
      token: secret,
    });
  }

  if (body.action === "revoke-token") {
    if (typeof body.tokenId !== "string") {
      return NextResponse.json(
        { error: "SCIM token id is required" },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const nextScim = {
      ...scim,
      tokens: scim.tokens.map((token) =>
        token.id === body.tokenId && !token.revokedAt
          ? { ...token, revokedAt: now }
          : token,
      ),
    };
    await saveScimSettings(currentWorkspace, nextScim);
    return NextResponse.json({ scim: safeScimSettings(nextScim) });
  }

  return NextResponse.json(
    { error: "Unsupported SCIM action" },
    { status: 400 },
  );
}
