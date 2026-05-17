import {
  type PermissionLevel,
  asRecord,
  canPerformWorkspacePermission,
  readPermissionLevel,
} from "@/lib/workspace-permissions";

export type WorkspaceAiSettings = {
  enabled: boolean;
  agentGuidance: string;
  usagePermission: PermissionLevel;
  issueSuggestions: boolean;
  summaries: boolean;
  autoTriage: boolean;
};

export const MAX_WORKSPACE_AGENT_GUIDANCE_LENGTH = 4000;

export const DEFAULT_WORKSPACE_AI_SETTINGS: WorkspaceAiSettings = {
  enabled: true,
  agentGuidance: "",
  usagePermission: "members",
  issueSuggestions: true,
  summaries: true,
  autoTriage: false,
};

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function readWorkspaceAiSettings(
  settings: unknown,
): WorkspaceAiSettings {
  const root = asRecord(settings);
  const ai = asRecord(root.ai);
  const agents = asRecord(root.agents);
  const legacyGuidance =
    ai.agentGuidance ??
    ai.guidance ??
    agents.agentGuidance ??
    agents.guidance ??
    root.agentGuidance;

  return {
    enabled: readBoolean(
      ai.enabled ?? ai.aiFeaturesEnabled,
      DEFAULT_WORKSPACE_AI_SETTINGS.enabled,
    ),
    agentGuidance:
      typeof legacyGuidance === "string"
        ? legacyGuidance
        : DEFAULT_WORKSPACE_AI_SETTINGS.agentGuidance,
    usagePermission: readPermissionLevel(
      ai.usagePermission ?? ai.agentUsagePermission,
      DEFAULT_WORKSPACE_AI_SETTINGS.usagePermission,
    ),
    issueSuggestions: readBoolean(
      ai.issueSuggestions,
      DEFAULT_WORKSPACE_AI_SETTINGS.issueSuggestions,
    ),
    summaries: readBoolean(
      ai.summaries,
      DEFAULT_WORKSPACE_AI_SETTINGS.summaries,
    ),
    autoTriage: readBoolean(
      ai.autoTriage,
      DEFAULT_WORKSPACE_AI_SETTINGS.autoTriage,
    ),
  };
}

export function serializeWorkspaceAiSettings(settings: WorkspaceAiSettings) {
  return {
    enabled: settings.enabled,
    agentGuidance: settings.agentGuidance,
    usagePermission: settings.usagePermission,
    issueSuggestions: settings.issueSuggestions,
    summaries: settings.summaries,
    autoTriage: settings.autoTriage,
  };
}

export function canUseWorkspaceAi(
  role: string | undefined,
  settings: WorkspaceAiSettings,
) {
  return (
    settings.enabled &&
    canPerformWorkspacePermission(role, settings.usagePermission, {
      includeGuestsForAnyone: false,
    })
  );
}
