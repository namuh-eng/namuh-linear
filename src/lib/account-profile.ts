type AccountProfileSettings = {
  username: string;
};

const DEFAULT_ACCOUNT_PROFILE_SETTINGS: AccountProfileSettings = {
  username: "",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function readAccountProfileFromUserSettings(
  settings: unknown,
): AccountProfileSettings {
  const parsed = asRecord(settings);
  const accountProfile = asRecord(parsed.accountProfile);

  return {
    username:
      normalizeUsername(accountProfile.username) ||
      DEFAULT_ACCOUNT_PROFILE_SETTINGS.username,
  };
}

export function writeAccountProfileToUserSettings(
  settings: unknown,
  accountProfile: AccountProfileSettings,
) {
  const parsed = asRecord(settings);

  return {
    ...parsed,
    accountProfile,
  };
}

export function sanitizeAccountProfileUsername(value: unknown) {
  return normalizeUsername(value);
}
