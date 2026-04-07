export type PermissionLevel = "admins" | "members" | "anyone";
export type WorkspaceMemberRole = "owner" | "admin" | "member" | "guest";
export type WebhookEventType = "created" | "updated" | "deleted";

export type OAuthApplicationRecord = {
  id: string;
  name: string;
  clientId: string;
  clientSecretPreview: string;
  redirectUrl: string;
  createdAt: string;
};

export type WorkspaceWebhookRecord = {
  id: string;
  label: string | null;
  url: string;
  events: WebhookEventType[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceApiKeyRecord = {
  id: string;
  name: string;
  keyPrefix: string;
  accessLevel: "Member";
  createdAt: string;
  lastUsedAt: string | null;
  creator: {
    name: string;
    email: string;
    image: string | null;
  };
};

export type ApiSettingsPayload = {
  permissionLevel: PermissionLevel;
  viewerRole: WorkspaceMemberRole;
  canManageWorkspaceApi: boolean;
  canCreateApiKeys: boolean;
  docs: {
    graphql: string;
    oauthApplications: string;
    webhooks: string;
  };
  oauthApplications: OAuthApplicationRecord[];
  webhooks: WorkspaceWebhookRecord[];
  apiKeys: WorkspaceApiKeyRecord[];
};

export const GRAPHQL_DOCS_URL = "https://linear.app/developers/graphql";
export const OAUTH_APPLICATIONS_DOCS_URL =
  "https://linear.app/developers/oauth-2-0-authentication";
export const WEBHOOKS_DOCS_URL = "https://linear.app/developers/webhooks";

const PERMISSION_LEVELS = new Set<PermissionLevel>([
  "admins",
  "members",
  "anyone",
]);
const WEBHOOK_EVENT_TYPES = new Set<WebhookEventType>([
  "created",
  "updated",
  "deleted",
]);

type WorkspaceApiSettingsState = {
  oauthApplications: OAuthApplicationRecord[];
};

const DEFAULT_WORKSPACE_API_SETTINGS: WorkspaceApiSettingsState = {
  oauthApplications: [],
};

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function readPermissionLevel(
  value: unknown,
  fallback: PermissionLevel,
): PermissionLevel {
  return typeof value === "string" &&
    PERMISSION_LEVELS.has(value as PermissionLevel)
    ? (value as PermissionLevel)
    : fallback;
}

export function isPermissionLevel(value: unknown): value is PermissionLevel {
  return (
    typeof value === "string" && PERMISSION_LEVELS.has(value as PermissionLevel)
  );
}

export function normalizeWebhookEvents(value: unknown): WebhookEventType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (eventName): eventName is WebhookEventType =>
          typeof eventName === "string" &&
          WEBHOOK_EVENT_TYPES.has(eventName as WebhookEventType),
      ),
    ),
  );
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function readOAuthApplication(value: unknown): OAuthApplicationRecord | null {
  const record = asRecord(value);
  const id = typeof record.id === "string" ? record.id : null;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const clientId =
    typeof record.clientId === "string" ? record.clientId.trim() : "";
  const clientSecretPreview =
    typeof record.clientSecretPreview === "string"
      ? record.clientSecretPreview.trim()
      : "";
  const redirectUrl =
    typeof record.redirectUrl === "string" ? record.redirectUrl.trim() : "";
  const createdAt = isIsoDate(record.createdAt) ? record.createdAt : null;

  if (
    !id ||
    !name ||
    !clientId ||
    !clientSecretPreview ||
    !redirectUrl ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    name,
    clientId,
    clientSecretPreview,
    redirectUrl,
    createdAt,
  };
}

export function readWorkspaceApiSettings(
  settings: unknown,
): WorkspaceApiSettingsState {
  const apiSettings = asRecord(asRecord(settings).api);
  const oauthApplications = Array.isArray(apiSettings.oauthApplications)
    ? apiSettings.oauthApplications
        .map((application) => readOAuthApplication(application))
        .filter((application): application is OAuthApplicationRecord =>
          Boolean(application),
        )
    : DEFAULT_WORKSPACE_API_SETTINGS.oauthApplications;

  return {
    oauthApplications,
  };
}

export function serializeWorkspaceApiSettings(
  apiSettings: WorkspaceApiSettingsState,
) {
  return {
    oauthApplications: apiSettings.oauthApplications,
  };
}

export function canManageWorkspaceApi(role: WorkspaceMemberRole) {
  return role === "owner" || role === "admin";
}

export function canMemberCreateApiKeys(
  role: WorkspaceMemberRole,
  permissionLevel: PermissionLevel,
) {
  if (permissionLevel === "admins") {
    return canManageWorkspaceApi(role);
  }

  return role !== "guest";
}
