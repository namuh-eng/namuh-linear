import { expect, test } from "@playwright/test";

test.describe("Workspace switcher menu", () => {
  test("lists memberships, preserves workspace-scoped route when switching, and exposes management actions", async ({
    page,
  }) => {
    const suffix = Date.now().toString(36);
    const firstSlug = `switcher-a-${suffix}`;
    const secondSlug = `switcher-b-${suffix}`;
    const firstName = `Switcher A ${suffix}`;
    const secondName = `Switcher B ${suffix}`;

    const firstResponse = await page.request.post("/api/workspaces", {
      data: { name: firstName, urlSlug: firstSlug },
    });
    expect(firstResponse.status()).toBe(201);

    const secondResponse = await page.request.post("/api/workspaces", {
      data: { name: secondName, urlSlug: secondSlug },
    });
    expect(secondResponse.status()).toBe(201);

    await page.goto(`/${firstSlug}/settings/account/preferences`);
    await page.waitForLoadState("networkidle");
    const workspaceSwitcher = page.getByLabel("Workspace switcher");
    await expect(workspaceSwitcher).toContainText(firstName);
    await expect(workspaceSwitcher).toBeEnabled();

    await workspaceSwitcher.click();
    await expect(workspaceSwitcher).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("menu", { name: "Workspace and account menu" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", {
        name: `${firstName} (current workspace)`,
      }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("menuitem", { name: `Switch to ${secondName}` }),
    ).toHaveAttribute("href", `/${secondSlug}/settings/account/preferences`);
    await expect(
      page.getByRole("menuitem", { name: "Workspace settings" }),
    ).toHaveAttribute("href", `/${firstSlug}/settings/workspace`);
    await expect(
      page.getByRole("menuitem", { name: "Create workspace" }),
    ).toHaveAttribute("href", "/create-workspace");

    await page
      .getByRole("menuitem", { name: `Switch to ${secondName}` })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/${secondSlug}/settings/account/preferences$`),
    );
    await expect(page.getByLabel("Workspace switcher")).toContainText(
      secondName,
    );
  });
});
