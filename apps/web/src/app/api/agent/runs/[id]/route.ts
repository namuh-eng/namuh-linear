import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import {
  type AgentSuggestionStatus,
  updateAgentSuggestion,
} from "@/lib/agent-runs";
import { requireApiSession } from "@/lib/api-auth";
import {
  createHeadlessAgentRunsClient,
  headlessAgentRunsEnabled,
  mintInternalApiToken,
} from "@/lib/headless-api";
import { NextResponse } from "next/server";

const suggestionStatuses = new Set(["accepted", "declined"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const workspaceId = await resolveActiveWorkspaceId(session.user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  if (headlessAgentRunsEnabled()) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { id } = await params;
    const token = await mintInternalApiToken({
      userId: session.user.id,
      workspaceId,
    });
    const client = createHeadlessAgentRunsClient(token);
    const { data, error, response } = await client.PATCH("/agent/runs/{id}", {
      params: { path: { id } },
      body: body as never,
    });
    if (error) {
      return NextResponse.json(error, {
        status: (response as Response).status,
      });
    }
    return NextResponse.json(data, { status: (response as Response).status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const suggestionId =
    typeof body.suggestionId === "string" ? body.suggestionId : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!suggestionId || !suggestionStatuses.has(status)) {
    return NextResponse.json(
      { error: "Invalid suggestion action" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const run = updateAgentSuggestion(
    workspaceId,
    id,
    suggestionId,
    status as AgentSuggestionStatus,
  );

  if (!run) {
    return NextResponse.json({ error: "Agent run not found" }, { status: 404 });
  }

  return NextResponse.json({ run });
}
