import { expect, test } from "@playwright/test";

test.describe("Account security and access", () => {
  test("shows Linear-style sections and renders sessions/passkeys without account API key controls", async ({
    page,
  }) => {
    const suffix = Date.now().toString(36);
    const workspaceSlug = `account-security-${suffix}`;
    const workspaceResponse = await page.request.post("/api/workspaces", {
      data: {
        name: `Account Security ${suffix}`,
        urlSlug: workspaceSlug,
      },
    });
    expect(workspaceResponse.status()).toBe(201);

    // Create a second session for the same authenticated test user so the page
    // has a non-current session that can be revoked without logging itself out.
    const sessionResponse = await page.request.post(
      "/api/test/create-session",
      {
        data: { email: "test@example.com" },
      },
    );
    expect(sessionResponse.status()).toBe(200);

    await page.goto(`/${workspaceSlug}/settings/account/security`);

    await expect(
      page.getByRole("heading", { name: "Security & access" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Passkeys" })).toBeVisible();
    await expect(
      page.getByText(/Passkeys are not configured for this workspace yet/i),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Add passkey" }),
    ).toBeEnabled();
    await expect(
      page.getByText(/No passkeys have been added yet/i),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Personal API keys" }),
    ).toHaveCount(0);
    await expect(page.getByLabel("API key name")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Create API key" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Authorized applications" }),
    ).toBeVisible();
    await expect(page.getByText(/Two-factor authentication/i)).toHaveCount(0);

    await page.getByRole("button", { name: "Show details" }).first().click();
    await expect(page.getByText("Original sign-in")).toBeVisible();
    await expect(page.getByText("Last seen")).toBeVisible();

    const revokeButtons = page.getByRole("button", {
      name: "Revoke",
      exact: true,
    });
    const initialRevokeCount = await revokeButtons.count();
    expect(initialRevokeCount).toBeGreaterThanOrEqual(2);
    await expect(page.getByText("Current session")).toBeVisible();
    for (let index = 0; index < initialRevokeCount; index += 1) {
      const button = revokeButtons.nth(index);
      if (!(await button.isDisabled())) {
        await button.click();
        break;
      }
    }
    await expect(page.getByText("Session revoked.")).toBeVisible();
  });

  test("rejects direct account-security API key creation", async ({ page }) => {
    const response = await page.request.post("/api/account/security", {
      data: { action: "createApiKey", name: "E2E direct key" },
    });

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/workspace API settings/i),
      }),
    );
  });
});
