import { createHash, randomBytes } from "node:crypto";

export type SamlStatus = "not_configured" | "configured" | "tested" | "error";

export type SamlSecuritySettings = {
  enabled: boolean;
  domains: string[];
  idpSsoUrl: string;
  entityId: string;
  certificate: string;
  metadataUrl: string;
  lastTestedAt: string | null;
  status: SamlStatus;
  lastError: string | null;
};

export type StoredScimToken = {
  id: string;
  name: string;
  tokenHash: string;
  prefix: string;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

export type SafeScimToken = Omit<StoredScimToken, "tokenHash">;

export type ScimSecuritySettings = {
  enabled: boolean;
  baseUrl: string;
  status: "disabled" | "enabled";
  lastSyncAt: string | null;
  tokens: SafeScimToken[];
};

export type StoredScimSecuritySettings = Omit<
  ScimSecuritySettings,
  "tokens"
> & {
  tokens: StoredScimToken[];
};

export const DEFAULT_SAML_SETTINGS: SamlSecuritySettings = {
  enabled: false,
  domains: [],
  idpSsoUrl: "",
  entityId: "",
  certificate: "",
  metadataUrl: "",
  lastTestedAt: null,
  status: "not_configured",
  lastError: null,
};

export function asRecord(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^@+/, "");
}

export function normalizeDomains(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((domain): domain is string => typeof domain === "string")
        .map(normalizeDomain)
        .filter((domain) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)),
    ),
  );
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readDateString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readSamlStatus(value: unknown): SamlStatus {
  return value === "configured" || value === "tested" || value === "error"
    ? value
    : "not_configured";
}

export function readSamlSecuritySettings(
  settings: unknown,
): SamlSecuritySettings {
  const root = asRecord(settings);
  const security = asRecord(root.security);
  const saml = asRecord(security.saml ?? root.saml ?? root.sso);
  const idpSsoUrl = readString(
    saml.idpSsoUrl ?? saml.ssoUrl ?? saml.ssoURL ?? saml.url,
  );

  return {
    enabled: typeof saml.enabled === "boolean" ? saml.enabled : false,
    domains: normalizeDomains(saml.domains ?? saml.emailDomains),
    idpSsoUrl,
    entityId: readString(saml.entityId ?? saml.issuer),
    certificate: readString(saml.certificate),
    metadataUrl: readString(saml.metadataUrl),
    lastTestedAt: readDateString(saml.lastTestedAt),
    status: readSamlStatus(saml.status),
    lastError: readDateString(saml.lastError),
  };
}

export function serializeSamlSecuritySettings(
  saml: SamlSecuritySettings,
): SamlSecuritySettings & { ssoUrl: string } {
  return {
    ...saml,
    domains: normalizeDomains(saml.domains),
    idpSsoUrl: saml.idpSsoUrl.trim(),
    ssoUrl: saml.idpSsoUrl.trim(),
    entityId: saml.entityId.trim(),
    certificate: saml.certificate.trim(),
    metadataUrl: saml.metadataUrl.trim(),
    lastError: saml.lastError?.trim() || null,
  };
}

export function validateSamlForSave(input: unknown) {
  const body = asRecord(input);
  if (body.domains !== undefined && !Array.isArray(body.domains)) {
    return "SAML domains must be a list";
  }
  for (const field of [
    "idpSsoUrl",
    "entityId",
    "certificate",
    "metadataUrl",
  ] as const) {
    if (body[field] !== undefined && typeof body[field] !== "string") {
      return `SAML ${field} must be a string`;
    }
  }
  if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
    return "SAML enabled must be a boolean";
  }
  const idpSsoUrl = readString(body.idpSsoUrl ?? body.ssoUrl);
  if (idpSsoUrl && !isHttpUrl(idpSsoUrl)) {
    return "SAML IdP SSO URL must be a valid URL";
  }
  const metadataUrl = readString(body.metadataUrl);
  if (metadataUrl && !isHttpUrl(metadataUrl)) {
    return "SAML metadata URL must be a valid URL";
  }
  return null;
}

export function mergeSamlSettings(
  current: SamlSecuritySettings,
  input: unknown,
): SamlSecuritySettings {
  const body = asRecord(input);
  const next: SamlSecuritySettings = {
    ...current,
    enabled: typeof body.enabled === "boolean" ? body.enabled : current.enabled,
    domains:
      body.domains === undefined
        ? current.domains
        : normalizeDomains(body.domains),
    idpSsoUrl:
      typeof body.idpSsoUrl === "string"
        ? body.idpSsoUrl.trim()
        : current.idpSsoUrl,
    entityId:
      typeof body.entityId === "string"
        ? body.entityId.trim()
        : current.entityId,
    certificate:
      typeof body.certificate === "string"
        ? body.certificate.trim()
        : current.certificate,
    metadataUrl:
      typeof body.metadataUrl === "string"
        ? body.metadataUrl.trim()
        : current.metadataUrl,
  };

  const hasMinimumConfig = Boolean(
    next.idpSsoUrl && next.entityId && (next.certificate || next.metadataUrl),
  );
  return {
    ...next,
    status: hasMinimumConfig ? "configured" : "not_configured",
    lastError: hasMinimumConfig ? null : next.lastError,
  };
}

export function testSamlSettings(
  saml: SamlSecuritySettings,
): SamlSecuritySettings {
  const missing = [];
  if (saml.domains.length === 0) missing.push("domain");
  if (!saml.idpSsoUrl) missing.push("IdP SSO URL");
  if (!saml.entityId) missing.push("issuer/entity ID");
  if (!saml.certificate && !saml.metadataUrl)
    missing.push("certificate or metadata URL");

  if (missing.length > 0) {
    return {
      ...saml,
      enabled: false,
      status: "error",
      lastError: `Missing ${missing.join(", ")}.`,
      lastTestedAt: new Date().toISOString(),
    };
  }

  return {
    ...saml,
    status: "tested",
    lastError: null,
    lastTestedAt: new Date().toISOString(),
  };
}

export function readStoredScimSecuritySettings(
  settings: unknown,
  baseUrl: string,
): StoredScimSecuritySettings {
  const scim = asRecord(asRecord(asRecord(settings).security).scim);
  const tokens = Array.isArray(scim.tokens) ? scim.tokens : [];

  return {
    enabled: typeof scim.enabled === "boolean" ? scim.enabled : false,
    baseUrl,
    status: scim.enabled === true ? "enabled" : "disabled",
    lastSyncAt: readDateString(scim.lastSyncAt),
    tokens: tokens
      .map((token) => asRecord(token))
      .filter(
        (token) =>
          typeof token.id === "string" && typeof token.tokenHash === "string",
      )
      .map((token) => ({
        id: String(token.id),
        name: readString(token.name) || "SCIM token",
        tokenHash: String(token.tokenHash),
        prefix: readString(token.prefix),
        createdAt: readDateString(token.createdAt) ?? new Date(0).toISOString(),
        revokedAt: readDateString(token.revokedAt),
        lastUsedAt: readDateString(token.lastUsedAt),
      })),
  };
}

export function safeScimSettings(
  scim: StoredScimSecuritySettings,
): ScimSecuritySettings {
  return {
    enabled: scim.enabled,
    baseUrl: scim.baseUrl,
    status: scim.enabled ? "enabled" : "disabled",
    lastSyncAt: scim.lastSyncAt,
    tokens: scim.tokens.map(({ tokenHash: _tokenHash, ...token }) => token),
  };
}

export function createScimToken(name = "SCIM token") {
  const secret = `scim_${randomBytes(24).toString("base64url")}`;
  const now = new Date().toISOString();
  const token: StoredScimToken = {
    id: randomBytes(8).toString("hex"),
    name: name.trim() || "SCIM token",
    tokenHash: hashScimToken(secret),
    prefix: `${secret.slice(0, 10)}…`,
    createdAt: now,
    revokedAt: null,
    lastUsedAt: null,
  };
  return { token, secret };
}

export function hashScimToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function serializeStoredScimSettings(scim: StoredScimSecuritySettings) {
  return {
    enabled: scim.enabled,
    baseUrl: scim.baseUrl,
    status: scim.enabled ? "enabled" : "disabled",
    lastSyncAt: scim.lastSyncAt,
    tokens: scim.tokens,
  };
}
