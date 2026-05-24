type SocialLinkProvider = "google" | "github" | "gitlab" | "slack";

type SocialSignInOptions = {
  provider: SocialLinkProvider;
  callbackURL: string;
  errorCallbackURL?: string;
};

type MagicLinkOptions = {
  email: string;
  callbackURL: string;
  errorCallbackURL?: string;
  fetchOptions?: { headers?: Record<string, string> };
};

type LinkSocialAccountOptions = {
  provider: SocialLinkProvider;
  callbackURL: string;
  errorCallbackURL?: string;
};

type LinkSocialAccountResult = {
  url?: string;
  data?: { url?: string; redirect?: boolean };
  error?: { code?: string; status?: number; message?: string };
};

type UnlinkSocialAccountOptions = {
  providerId: SocialLinkProvider;
  accountId?: string;
};

type UnlinkSocialAccountResult = {
  data?: { status?: boolean };
  error?: { code?: string; status?: number; message?: string };
};

type KratosFlow = {
  ui?: {
    action?: string;
    nodes?: Array<{ attributes?: { name?: string; value?: string } }>;
  };
  redirect_browser_to?: string;
};

type PasskeySignInOptions = {
  callbackURL: string;
};

type PasskeySignInResult = {
  redirectTo?: string;
};

type PasskeyRecord = {
  id: string;
  name?: string | null;
  createdAt?: Date | string | null;
};

export class PasskeySignInError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "BROWSER_UNSUPPORTED"
      | "CANCELED"
      | "NOT_CONFIGURED"
      | "FAILED",
  ) {
    super(message);
    this.name = "PasskeySignInError";
  }
}

export class PasskeyRegistrationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "BROWSER_UNSUPPORTED"
      | "CANCELED"
      | "NOT_CONFIGURED"
      | "FAILED",
  ) {
    super(message);
    this.name = "PasskeyRegistrationError";
  }
}

function kratosBrowserUrl(kind: "login" | "registration", returnTo: string) {
  const params = new URLSearchParams({ return_to: returnTo });
  return `/api/auth/kratos/self-service/${kind}/browser?${params.toString()}`;
}

function kratosProxyAction(action: string) {
  const url = new URL(action, window.location.origin);
  return `/api/auth/kratos${url.pathname}${url.search}`;
}

function csrfToken(flow: KratosFlow | null) {
  return flow?.ui?.nodes?.find((node) => node.attributes?.name === "csrf_token")
    ?.attributes?.value;
}

async function startKratosFlow(
  kind: "login" | "registration",
  returnTo: string,
) {
  const response = await fetch(kratosBrowserUrl(kind, returnTo), {
    credentials: "include",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Unable to start the Kratos authentication flow.");
  }
  return (await response.json()) as KratosFlow;
}

async function submitKratosFlow(
  flow: KratosFlow,
  body: Record<string, unknown>,
): Promise<LinkSocialAccountResult> {
  const action = flow.ui?.action;
  if (!action) {
    throw new Error("Kratos flow is missing a submit action.");
  }

  const token = csrfToken(flow);
  const response = await fetch(kratosProxyAction(action), {
    method: "POST",
    credentials: "include",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(token ? { ...body, csrf_token: token } : body),
  });
  const payload = (await response
    .json()
    .catch(() => null)) as KratosFlow | null;
  if (!response.ok) {
    return {
      error: {
        status: response.status,
        message: "Kratos authentication flow failed.",
      },
    };
  }

  const redirect = payload?.redirect_browser_to;
  return {
    data: { url: redirect, redirect: Boolean(redirect) },
    url: redirect,
  };
}

export const signIn = {
  async social(options: SocialSignInOptions) {
    const flow = await startKratosFlow("login", options.callbackURL);
    return submitKratosFlow(flow, {
      method: "oidc",
      provider: options.provider,
    });
  },
  async magicLink(options: MagicLinkOptions): Promise<unknown> {
    const flow = await startKratosFlow("login", options.callbackURL);
    return submitKratosFlow(flow, {
      method: "link",
      identifier: options.email,
      ...(options.fetchOptions?.headers?.["x-captcha-response"]
        ? {
            captcha_response:
              options.fetchOptions.headers["x-captcha-response"],
          }
        : {}),
    });
  },
};

export async function signOut() {
  const flow = await fetch("/api/auth/kratos/self-service/logout/browser", {
    credentials: "include",
    headers: { accept: "application/json" },
  });
  const payload = (await flow.json().catch(() => null)) as {
    logout_url?: string;
  } | null;
  if (payload?.logout_url) {
    window.location.assign(kratosProxyAction(payload.logout_url));
  }
}

export function useSession() {
  return { data: null, isPending: false };
}

export const authClient = { signIn, signOut, useSession };

export async function linkSocialAccount(
  options: LinkSocialAccountOptions,
): Promise<LinkSocialAccountResult> {
  const flow = await startKratosFlow("login", options.callbackURL);
  return submitKratosFlow(flow, { method: "oidc", provider: options.provider });
}

export async function unlinkSocialAccount(
  options: UnlinkSocialAccountOptions,
): Promise<UnlinkSocialAccountResult> {
  const response = await fetch("/api/account/connections", {
    method: "DELETE",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    return {
      error: {
        status: response.status,
        message: "Unable to disconnect this account.",
      },
    };
  }
  return { data: { status: true } };
}

export function browserSupportsPasskeys() {
  return (
    typeof window !== "undefined" &&
    typeof PublicKeyCredential !== "undefined" &&
    Boolean(navigator.credentials?.create) &&
    Boolean(navigator.credentials?.get)
  );
}

function passkeyUnavailableMessage() {
  return "Passkey authentication has moved to Kratos and is not configured in this environment.";
}

export async function signInWithPasskey({
  callbackURL,
}: PasskeySignInOptions): Promise<PasskeySignInResult> {
  if (!browserSupportsPasskeys()) {
    throw new PasskeySignInError(
      "This browser doesn't support passkeys. Use email or Google to log in.",
      "BROWSER_UNSUPPORTED",
    );
  }
  throw new PasskeySignInError(passkeyUnavailableMessage(), "NOT_CONFIGURED");
}

export async function enrollPasskey(_name: string): Promise<PasskeyRecord> {
  if (!browserSupportsPasskeys()) {
    throw new PasskeyRegistrationError(
      "This browser doesn't support passkey enrollment. Use a browser with WebAuthn support.",
      "BROWSER_UNSUPPORTED",
    );
  }
  throw new PasskeyRegistrationError(
    passkeyUnavailableMessage(),
    "NOT_CONFIGURED",
  );
}
