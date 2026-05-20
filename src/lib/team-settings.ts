export type WorkflowAutomationRuleTrigger =
  | "issue_created"
  | "branch_created"
  | "pull_request_merged"
  | "issue_assigned";

export type WorkflowAutomationTransitionRule = {
  id: string;
  name: string;
  trigger: WorkflowAutomationRuleTrigger;
  sourceStatusId: string | null;
  targetStatusId: string;
  enabled: boolean;
};

export type TeamWorkflowAutomationSettings = {
  gitBranchFormat: string;
  gitBranchAutomationEnabled: boolean;
  gitPrAutomationEnabled: boolean;
  gitBranchCreateTargetStatusId: string | null;
  gitPrMergeTargetStatusId: string | null;
  autoAssignEnabled: boolean;
  autoAssignMode: "creator" | "team_lead" | "round_robin" | "none";
  defaultAssigneeId: string | null;
  statusTransitionRules: WorkflowAutomationTransitionRule[];
};

export type TeamSettingsFlags = {
  emailEnabled: boolean;
  detailedHistory: boolean;
  agentGuidance: string;
  autoAssignment: boolean;
  discussionSummariesEnabled: boolean;
  discussionSummaryMinComments: number;
  discussionSummaryRefreshMode: "manual" | "automatic";
  triageAcceptDestinationStateId: string | null;
  triageDeclineDestinationStateId: string | null;
  workflowAutomation: TeamWorkflowAutomationSettings;
};

const DEFAULT_WORKFLOW_AUTOMATION: TeamWorkflowAutomationSettings = {
  gitBranchFormat: "{teamKey}-{issueNumber}-{issueTitle}",
  gitBranchAutomationEnabled: false,
  gitPrAutomationEnabled: false,
  gitBranchCreateTargetStatusId: null,
  gitPrMergeTargetStatusId: null,
  autoAssignEnabled: false,
  autoAssignMode: "none",
  defaultAssigneeId: null,
  statusTransitionRules: [],
};

export function readWorkflowAutomationSettings(
  settings: unknown,
): TeamWorkflowAutomationSettings {
  const parsed =
    settings && typeof settings === "object"
      ? (settings as Record<string, unknown>)
      : {};
  const nested =
    parsed.workflowAutomation && typeof parsed.workflowAutomation === "object"
      ? (parsed.workflowAutomation as Record<string, unknown>)
      : parsed;

  const autoAssignMode =
    nested.autoAssignMode === "creator" ||
    nested.autoAssignMode === "team_lead" ||
    nested.autoAssignMode === "round_robin" ||
    nested.autoAssignMode === "none"
      ? nested.autoAssignMode
      : DEFAULT_WORKFLOW_AUTOMATION.autoAssignMode;

  const statusTransitionRules = Array.isArray(nested.statusTransitionRules)
    ? nested.statusTransitionRules
        .map((rule, index) => normalizeTransitionRule(rule, index))
        .filter((rule): rule is WorkflowAutomationTransitionRule =>
          Boolean(rule),
        )
    : [];

  return {
    gitBranchFormat:
      typeof nested.gitBranchFormat === "string" &&
      nested.gitBranchFormat.trim()
        ? nested.gitBranchFormat
        : DEFAULT_WORKFLOW_AUTOMATION.gitBranchFormat,
    gitBranchAutomationEnabled: nested.gitBranchAutomationEnabled === true,
    gitPrAutomationEnabled: nested.gitPrAutomationEnabled === true,
    gitBranchCreateTargetStatusId:
      typeof nested.gitBranchCreateTargetStatusId === "string"
        ? nested.gitBranchCreateTargetStatusId
        : null,
    gitPrMergeTargetStatusId:
      typeof nested.gitPrMergeTargetStatusId === "string"
        ? nested.gitPrMergeTargetStatusId
        : null,
    autoAssignEnabled:
      nested.autoAssignEnabled === true || parsed.autoAssignment === true,
    autoAssignMode,
    defaultAssigneeId:
      typeof nested.defaultAssigneeId === "string"
        ? nested.defaultAssigneeId
        : null,
    statusTransitionRules,
  };
}

function normalizeTransitionRule(rule: unknown, index: number) {
  if (!rule || typeof rule !== "object") {
    return null;
  }

  const parsed = rule as Record<string, unknown>;
  const trigger =
    parsed.trigger === "issue_created" ||
    parsed.trigger === "branch_created" ||
    parsed.trigger === "pull_request_merged" ||
    parsed.trigger === "issue_assigned"
      ? parsed.trigger
      : "issue_created";
  const targetStatusId =
    typeof parsed.targetStatusId === "string" ? parsed.targetStatusId : "";

  return {
    id:
      typeof parsed.id === "string" && parsed.id.trim()
        ? parsed.id
        : `rule-${index + 1}`,
    name:
      typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name
        : `Transition rule ${index + 1}`,
    trigger,
    sourceStatusId:
      typeof parsed.sourceStatusId === "string" && parsed.sourceStatusId.trim()
        ? parsed.sourceStatusId
        : null,
    targetStatusId,
    enabled: parsed.enabled !== false,
  };
}

export function readTeamSettings(settings: unknown): TeamSettingsFlags {
  const parsed =
    settings && typeof settings === "object"
      ? (settings as Record<string, unknown>)
      : {};

  return {
    emailEnabled: parsed.emailEnabled === true,
    detailedHistory: parsed.detailedHistory !== false,
    agentGuidance:
      typeof parsed.agentGuidance === "string" ? parsed.agentGuidance : "",
    autoAssignment: parsed.autoAssignment === true,
    discussionSummariesEnabled: parsed.discussionSummariesEnabled === true,
    discussionSummaryMinComments:
      typeof parsed.discussionSummaryMinComments === "number" &&
      Number.isInteger(parsed.discussionSummaryMinComments) &&
      parsed.discussionSummaryMinComments >= 3 &&
      parsed.discussionSummaryMinComments <= 50
        ? parsed.discussionSummaryMinComments
        : 8,
    discussionSummaryRefreshMode:
      parsed.discussionSummaryRefreshMode === "automatic"
        ? "automatic"
        : "manual",
    triageAcceptDestinationStateId:
      typeof parsed.triageAcceptDestinationStateId === "string"
        ? parsed.triageAcceptDestinationStateId
        : null,
    triageDeclineDestinationStateId:
      typeof parsed.triageDeclineDestinationStateId === "string"
        ? parsed.triageDeclineDestinationStateId
        : null,
    workflowAutomation: readWorkflowAutomationSettings(settings),
  };
}

export function getMutableTeamSettings(settings: unknown) {
  return settings && typeof settings === "object"
    ? (settings as Record<string, unknown>)
    : {};
}
