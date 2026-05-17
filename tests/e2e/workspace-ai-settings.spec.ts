import { expect, test } from "@playwright/test";

test.describe("Workspace AI settings", () => {
  test("edits workspace controls, persists them, and enforces disabled agents", async ({
    page,
  }) => {
    await page.goto("/login?callbackUrl=%2Finbox");
    await expect
      .poll(async () => {
        return page.evaluate(async () => {
          const response = await fetch("/api/test/create-session", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com" }),
          });
          return response.status;
        });
      })
      .toBe(200);

    await page.request.patch("/api/workspaces/current/ai-settings", {
      data: {
        enabled: true,
        usagePermission: "members",
        agentGuidance: "",
        issueSuggestions: true,
        summaries: true,
        autoTriage: false,
      },
    });

    await page.goto("/foreverbrowsing/settings/ai");

    await expect(
      page.getByRole("heading", { name: "AI & Agents" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Workspace controls" }),
    ).toBeVisible();

    const enableToggle = page.getByLabel("Enable AI agents");
    if (await enableToggle.isChecked()) {
      await enableToggle.uncheck();
    }
    await page.getByLabel("Who can use AI agents").selectOption("admins");
    await page
      .getByLabel("Workspace agent guidance")
      .fill("E2E workspace policy: cite settings evidence.");
    await page.getByLabel("Issue suggestions").uncheck();
    await page.getByLabel("Auto-triage").check();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Workspace AI settings saved.")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Enable AI agents")).not.toBeChecked();
    await expect(page.getByLabel("Who can use AI agents")).toHaveValue(
      "admins",
    );
    await expect(page.getByLabel("Workspace agent guidance")).toHaveValue(
      "E2E workspace policy: cite settings evidence.",
    );

    const blockedRun = await page.request.post("/api/agent/runs", {
      data: {
        title: "Blocked by workspace setting",
        prompt: "Create a mock run only if workspace AI is enabled.",
      },
    });
    expect(blockedRun.status()).toBe(403);
    await expect(blockedRun.json()).resolves.toMatchObject({
      error: "AI agents are disabled for this workspace",
    });

    await page.getByLabel("Enable AI agents").check();
    await page.getByLabel("Issue suggestions").check();
    await page.getByLabel("Auto-triage").uncheck();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Workspace AI settings saved.")).toBeVisible();
  });
});
