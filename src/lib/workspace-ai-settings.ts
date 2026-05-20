import {
  DEFAULT_WORKSPACE_PERMISSION_SETTINGS,
  type PermissionLevel,
  asRecord,
  readPermissionLevel,
} from "@/lib/workspace-permissions";

export type WorkspaceAiSettings = {
  enabled: boolean;
  agentRunsEnabled: boolean;
  agentGuidance: string;
  agentGuidanceRole: PermissionLevel;
};

export type WorkspaceAiSettingsPatch = {
  enabled?: unknown;
  agentRunsEnabled?: unknown;
  agentGuidance?: unknown;
  agentGuidanceRole?: unknown;
};

export const DEFAULT_WORKSPACE_AI_SETTINGS: WorkspaceAiSettings = {
  enabled: true,
  agentRunsEnabled: true,
  agentGuidance: "",
  agentGuidanceRole: DEFAULT_WORKSPACE_PERMISSION_SETTINGS.agentGuidanceRole,
};

export function readWorkspaceAiSettings(
  settings: unknown,
): WorkspaceAiSettings {
  const root = asRecord(settings);
  const ai = asRecord(root.ai);
  const agents = asRecord(root.agents);
  const permissions = asRecord(asRecord(root.security).permissions);
  const guidanceCandidate =
    ai.agentGuidance ??
    ai.guidance ??
    agents.agentGuidance ??
    agents.guidance ??
    root.agentGuidance;

  return {
    enabled:
      typeof ai.enabled === "boolean"
        ? ai.enabled
        : DEFAULT_WORKSPACE_AI_SETTINGS.enabled,
    agentRunsEnabled:
      typeof ai.agentRunsEnabled === "boolean"
        ? ai.agentRunsEnabled
        : DEFAULT_WORKSPACE_AI_SETTINGS.agentRunsEnabled,
    agentGuidance:
      typeof guidanceCandidate === "string" ? guidanceCandidate : "",
    agentGuidanceRole: readPermissionLevel(
      permissions.agentGuidanceRole,
      DEFAULT_WORKSPACE_AI_SETTINGS.agentGuidanceRole,
    ),
  };
}

export function validateWorkspaceAiSettingsPatch(
  patch: WorkspaceAiSettingsPatch | null,
) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return "Invalid JSON body";
  }

  if (patch.enabled !== undefined && typeof patch.enabled !== "boolean") {
    return "AI feature status must be a boolean";
  }

  if (
    patch.agentRunsEnabled !== undefined &&
    typeof patch.agentRunsEnabled !== "boolean"
  ) {
    return "Agent run status must be a boolean";
  }

  if (
    patch.agentGuidance !== undefined &&
    typeof patch.agentGuidance !== "string"
  ) {
    return "Workspace guidance must be a string";
  }

  if (
    patch.agentGuidanceRole !== undefined &&
    !["admins", "members", "anyone"].includes(String(patch.agentGuidanceRole))
  ) {
    return "Agent guidance permission is invalid";
  }

  return null;
}

export function mergeWorkspaceAiSettings(
  settings: unknown,
  patch: WorkspaceAiSettingsPatch,
) {
  const root = asRecord(settings);
  const current = readWorkspaceAiSettings(root);
  const security = asRecord(root.security);
  const permissions = asRecord(security.permissions);
  const nextAi: WorkspaceAiSettings = {
    enabled:
      patch.enabled === undefined ? current.enabled : Boolean(patch.enabled),
    agentRunsEnabled:
      patch.agentRunsEnabled === undefined
        ? current.agentRunsEnabled
        : Boolean(patch.agentRunsEnabled),
    agentGuidance:
      patch.agentGuidance === undefined
        ? current.agentGuidance
        : String(patch.agentGuidance).trim().slice(0, 4000),
    agentGuidanceRole:
      patch.agentGuidanceRole === undefined
        ? current.agentGuidanceRole
        : readPermissionLevel(
            patch.agentGuidanceRole,
            current.agentGuidanceRole,
          ),
  };

  return {
    ...root,
    ai: {
      ...asRecord(root.ai),
      enabled: nextAi.enabled,
      agentRunsEnabled: nextAi.agentRunsEnabled,
      agentGuidance: nextAi.agentGuidance,
    },
    security: {
      ...security,
      permissions: {
        ...permissions,
        agentGuidanceRole: nextAi.agentGuidanceRole,
      },
    },
  };
}

export function describeWorkspaceAiCreateBlock(settings: WorkspaceAiSettings) {
  if (!settings.enabled) {
    return "Workspace AI features are disabled";
  }
  if (!settings.agentRunsEnabled) {
    return "Workspace agent runs are disabled";
  }
  return null;
}
