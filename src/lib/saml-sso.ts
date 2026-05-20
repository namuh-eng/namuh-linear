import { db } from "@/lib/db";
import { workspace } from "@/lib/db/schema";
import { readSamlSecuritySettings } from "@/lib/workspace-saml-scim";

export const SAML_NO_WORKSPACE_MESSAGE =
  "No SAML SSO enabled workspace could be found.";
export const SAML_INVALID_EMAIL_MESSAGE = "Enter a valid email address.";

export type SamlDiscoveryResult =
  | { ok: true; url: string }
  | { ok: false; status: 400 | 404; error: string };

export function extractEmailDomain(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }

  const domain = normalized.split("@").at(1);
  return domain && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain) ? domain : null;
}

export async function discoverSamlUrlFromEmail(
  email: string,
): Promise<SamlDiscoveryResult> {
  const domain = extractEmailDomain(email);
  if (!domain) {
    return { ok: false, status: 400, error: SAML_INVALID_EMAIL_MESSAGE };
  }

  const workspaces = await db
    .select({ settings: workspace.settings })
    .from(workspace);

  for (const record of workspaces) {
    const saml = readSamlSecuritySettings(record.settings);
    if (!saml.enabled || !saml.idpSsoUrl) {
      continue;
    }

    if (saml.domains.includes(domain)) {
      return { ok: true, url: saml.idpSsoUrl };
    }
  }

  return { ok: false, status: 404, error: SAML_NO_WORKSPACE_MESSAGE };
}
