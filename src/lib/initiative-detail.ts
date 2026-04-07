export type InitiativeUpdateHealth = "onTrack" | "atRisk" | "offTrack";

export interface InitiativeUpdateEntry {
  id: string;
  health: InitiativeUpdateHealth;
  body: string;
  actorName: string;
  actorImage: string | null;
  createdAt: string;
}

export interface InitiativeSettingsShape {
  updates: InitiativeUpdateEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInitiativeUpdateEntry(
  value: unknown,
): value is InitiativeUpdateEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.health === "onTrack" ||
      value.health === "atRisk" ||
      value.health === "offTrack") &&
    typeof value.body === "string" &&
    typeof value.actorName === "string" &&
    (typeof value.actorImage === "string" || value.actorImage === null) &&
    typeof value.createdAt === "string"
  );
}

export function readInitiativeSettings(
  settings: unknown,
): InitiativeSettingsShape {
  if (!isRecord(settings)) {
    return { updates: [] };
  }

  return {
    updates: Array.isArray(settings.updates)
      ? settings.updates.filter(isInitiativeUpdateEntry)
      : [],
  };
}

export function makeInitiativeUpdateEntry({
  health,
  body,
  actorName,
  actorImage,
}: {
  health: InitiativeUpdateHealth;
  body: string;
  actorName: string;
  actorImage: string | null;
}): InitiativeUpdateEntry {
  return {
    id: crypto.randomUUID(),
    health,
    body,
    actorName,
    actorImage,
    createdAt: new Date().toISOString(),
  };
}
