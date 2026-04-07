import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  issue,
  label,
  member,
  project,
  projectMember,
  projectMilestone,
  projectTeam,
  team,
  user,
  workflowState,
} from "@/lib/db/schema";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  // Find user's workspace
  const members = await db
    .select({ workspaceId: member.workspaceId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);

  if (members.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const workspaceId = members[0].workspaceId;

  // Find project by slug
  const projects = await db
    .select()
    .from(project)
    .where(and(eq(project.workspaceId, workspaceId), eq(project.slug, slug)))
    .limit(1);

  if (projects.length === 0) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const proj = projects[0];

  // Fetch related data in parallel
  const [leadData, milestones, teamLinks, memberLinks, projectIssues] =
    await Promise.all([
      // Lead
      proj.leadId
        ? db
            .select({ name: user.name, image: user.image })
            .from(user)
            .where(eq(user.id, proj.leadId))
            .limit(1)
        : Promise.resolve([]),

      // Milestones
      db
        .select()
        .from(projectMilestone)
        .where(eq(projectMilestone.projectId, proj.id))
        .orderBy(asc(projectMilestone.sortOrder)),

      // Teams
      db
        .select({ teamName: team.name, teamKey: team.key })
        .from(projectTeam)
        .innerJoin(team, eq(projectTeam.teamId, team.id))
        .where(eq(projectTeam.projectId, proj.id)),

      // Members
      db
        .select({ userName: user.name, userImage: user.image })
        .from(projectMember)
        .innerJoin(user, eq(projectMember.userId, user.id))
        .where(eq(projectMember.projectId, proj.id)),

      // Issues with states
      db
        .select({
          id: issue.id,
          number: issue.number,
          identifier: issue.identifier,
          title: issue.title,
          priority: issue.priority,
          stateId: issue.stateId,
          stateName: workflowState.name,
          stateCategory: workflowState.category,
          stateColor: workflowState.color,
          statePosition: workflowState.position,
          assigneeId: issue.assigneeId,
          assigneeName: user.name,
          assigneeImage: user.image,
          completedAt: issue.completedAt,
          createdAt: issue.createdAt,
        })
        .from(issue)
        .leftJoin(user, eq(issue.assigneeId, user.id))
        .leftJoin(workflowState, eq(issue.stateId, workflowState.id))
        .where(eq(issue.projectId, proj.id))
        .orderBy(asc(workflowState.position), desc(issue.createdAt)),
    ]);

  // Calculate milestone progress
  const milestoneData = milestones.map((m) => {
    const milestoneIssues = projectIssues.filter((i) => i.stateId !== null);
    const total = milestoneIssues.length;
    const completed = milestoneIssues.filter((i) => i.completedAt).length;
    return {
      id: m.id,
      name: m.name,
      issueCount: total,
      completedCount: completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  // Group issues by state for Issues tab
  const stateMap = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      color: string;
      position: number;
      issues: typeof projectIssues;
    }
  >();

  for (const iss of projectIssues) {
    if (!iss.stateId || !iss.stateName) continue;
    if (!stateMap.has(iss.stateId)) {
      stateMap.set(iss.stateId, {
        id: iss.stateId,
        name: iss.stateName,
        category: iss.stateCategory ?? "backlog",
        color: iss.stateColor ?? "#6b6f76",
        position: iss.statePosition ?? 0,
        issues: [],
      });
    }
    stateMap.get(iss.stateId)?.issues.push(iss);
  }

  const issueGroups = Array.from(stateMap.values())
    .sort((a, b) => a.position - b.position)
    .map((g) => ({
      state: {
        id: g.id,
        name: g.name,
        category: g.category,
        color: g.color,
      },
      issues: g.issues.map((i) => ({
        id: i.id,
        number: i.number,
        identifier: i.identifier,
        title: i.title,
        priority: i.priority,
        assignee: i.assigneeName
          ? { name: i.assigneeName, image: i.assigneeImage }
          : null,
        createdAt: i.createdAt,
      })),
    }));

  const totalIssues = projectIssues.length;
  const completedIssues = projectIssues.filter((i) => i.completedAt).length;

  return NextResponse.json({
    project: {
      id: proj.id,
      name: proj.name,
      description: proj.description,
      icon: proj.icon,
      slug: proj.slug,
      status: proj.status,
      priority: proj.priority,
      startDate: proj.startDate,
      targetDate: proj.targetDate,
      createdAt: proj.createdAt,
    },
    lead: leadData[0] ?? null,
    members: memberLinks.map((m) => ({
      name: m.userName,
      image: m.userImage,
    })),
    teams: teamLinks.map((t) => ({ name: t.teamName, key: t.teamKey })),
    milestones: milestoneData,
    issueGroups,
    progress: {
      total: totalIssues,
      completed: completedIssues,
      percentage:
        totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0,
    },
  });
}
