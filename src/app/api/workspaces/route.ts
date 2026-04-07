import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  member,
  team,
  teamMember,
  workflowState,
  workspace,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const DEFAULT_WORKFLOW_STATES = [
  {
    name: "Triage",
    category: "triage" as const,
    color: "#f59e0b",
    position: 0,
  },
  {
    name: "Backlog",
    category: "backlog" as const,
    color: "#6b6f76",
    position: 0,
    isDefault: true,
  },
  {
    name: "Todo",
    category: "unstarted" as const,
    color: "#6b6f76",
    position: 0,
  },
  {
    name: "In Progress",
    category: "started" as const,
    color: "#f59e0b",
    position: 0,
  },
  {
    name: "Done",
    category: "completed" as const,
    color: "#22c55e",
    position: 0,
  },
  {
    name: "Canceled",
    category: "canceled" as const,
    color: "#6b6f76",
    position: 0,
  },
];

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, urlSlug } = body as { name: string; urlSlug: string };

  if (!name?.trim() || !urlSlug?.trim()) {
    return NextResponse.json(
      { error: "Name and URL slug are required" },
      { status: 400 },
    );
  }

  const slug = urlSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length < 2 || slug.length > 63) {
    return NextResponse.json(
      { error: "URL slug must be between 2 and 63 characters" },
      { status: 400 },
    );
  }

  // Check for slug uniqueness
  const existing = await db
    .select({ id: workspace.id })
    .from(workspace)
    .where(eq(workspace.urlSlug, slug))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "This URL is already taken" },
      { status: 409 },
    );
  }

  // Create workspace, member, team, team member, and workflow states in a transaction
  const result = await db.transaction(async (tx) => {
    const [newWorkspace] = await tx
      .insert(workspace)
      .values({ name: name.trim(), urlSlug: slug })
      .returning();

    // Add creator as owner
    await tx.insert(member).values({
      userId: session.user.id,
      workspaceId: newWorkspace.id,
      role: "owner",
    });

    // Create default team with workspace name
    const teamKey = name
      .trim()
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, "X");

    const [newTeam] = await tx
      .insert(team)
      .values({
        name: name.trim(),
        key: teamKey,
        workspaceId: newWorkspace.id,
      })
      .returning();

    // Add creator to default team
    await tx.insert(teamMember).values({
      teamId: newTeam.id,
      userId: session.user.id,
    });

    // Create default workflow states
    await tx.insert(workflowState).values(
      DEFAULT_WORKFLOW_STATES.map((state) => ({
        ...state,
        teamId: newTeam.id,
      })),
    );

    return { workspace: newWorkspace, team: newTeam };
  });

  return NextResponse.json(result, { status: 201 });
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all workspaces the user is a member of
  const memberships = await db
    .select({
      workspaceId: member.workspaceId,
      role: member.role,
      workspaceName: workspace.name,
      workspaceSlug: workspace.urlSlug,
    })
    .from(member)
    .innerJoin(workspace, eq(member.workspaceId, workspace.id))
    .where(eq(member.userId, session.user.id));

  return NextResponse.json(memberships);
}
