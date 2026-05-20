import { expect, test } from "@playwright/test";

test.describe("Workspace AI settings", () => {
  test("edits workspace AI settings and enforces disabled agent runs", async ({
    page,
  }) => {
    const suffix = Date.now().toString(36);
    const workspaceSlug = `workspace-ai-${suffix}`;
    const workspaceResponse = await page.request.post("/api/workspaces", {
      data: {
        name: `Workspace AI ${suffix}`,
        urlSlug: workspaceSlug,
      },
    });
    expect(workspaceResponse.status()).toBe(201);

    await page.goto(`/${workspaceSlug}/settings/ai`);

    await expect(
      page.getByRole("heading", { name: "AI & Agents" }),
    ).toBeVisible();
    await expect(page.getByText("Workspace AI availability")).toBeVisible();
    await expect(page.getByLabel("Enable AI features")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await page
      .getByLabel("Workspace AI guidance")
      .fill("E2E guidance: cite evidence and avoid destructive changes.");
    await page.getByLabel("Workspace AI guidance").blur();
    await expect(page.getByText("Workspace AI settings saved")).toBeVisible();

    await page
      .getByLabel("Team guidance edit permission")
      .selectOption("members");
    await expect(page.getByText("Workspace AI settings saved")).toBeVisible();

    await page.getByLabel("Enable agent runs").click();
    await expect(page.getByLabel("Enable agent runs")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    await page.reload();
    await expect(page.getByLabel("Workspace AI guidance")).toHaveValue(
      "E2E guidance: cite evidence and avoid destructive changes.",
    );
    await expect(page.getByLabel("Enable agent runs")).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await expect(page.getByLabel("Team guidance edit permission")).toHaveValue(
      "members",
    );

    const apiResponse = await page.request.get("/api/workspaces/current/ai");
    expect(apiResponse.status()).toBe(200);
    await expect(apiResponse.json()).resolves.toMatchObject({
      ai: {
        agentRunsEnabled: false,
        agentGuidance:
          "E2E guidance: cite evidence and avoid destructive changes.",
        agentGuidanceRole: "members",
      },
    });

    await page.goto(`/${workspaceSlug}/agent`);
    await expect(
      page.getByText("Workspace agent runs are disabled"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start mock agent run" }),
    ).toBeDisabled();
  });
});
