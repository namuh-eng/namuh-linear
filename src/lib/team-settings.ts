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
};

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
  };
}

export function getMutableTeamSettings(settings: unknown) {
  return settings && typeof settings === "object"
    ? (settings as Record<string, unknown>)
    : {};
}
