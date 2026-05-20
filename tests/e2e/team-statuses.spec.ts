import { expect, test } from "@playwright/test";

test.describe("Team issue status workflow controls", () => {
  test("creates and edits status type, behavior metadata, defaults, and downstream options", async ({
    page,
  }) => {
    const suffix = Date.now().toString(36);
    const workspaceSlug = `team-statuses-${suffix}`;
    const workspaceResponse = await page.request.post("/api/workspaces", {
      data: { name: `Team Statuses ${suffix}`, urlSlug: workspaceSlug },
    });
    expect(workspaceResponse.status()).toBe(201);
    const { team } = await workspaceResponse.json();

    await page.goto(`/${workspaceSlug}/settings/teams/${team.key}/statuses`);
    await expect(
      page.getByRole("heading", { name: "Issue statuses" }),
    ).toBeVisible();
    await expect(
      page.getByText(/workflow automation links for every team status/),
    ).toBeVisible();

    await page.getByLabel("Add status").nth(3).click();
    await page.getByLabel("Name").fill(`QA Gate ${suffix}`);
    await page.getByLabel("Description").fill("Ready for quality review");
    await page.getByLabel("Workflow type").selectOption("completed");
    await page.getByLabel("Auto-archive issues after days").fill("9");
    await page
      .getByLabel("Workflow automation link")
      .fill("https://example.com/qa-gate");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Status created.")).toBeVisible();
    await expect(page.getByText(`QA Gate ${suffix}`)).toBeVisible();

    const statusesResponse = await page.request.get(
      `/api/teams/${team.key}/statuses`,
    );
    expect(statusesResponse.status()).toBe(200);
    const statusesPayload = await statusesResponse.json();
    expect(statusesPayload.statuses.completed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: `QA Gate ${suffix}`,
          behavior: expect.objectContaining({
            terminalBehavior: "resolved",
            autoArchiveDays: 9,
            automationUrl: "https://example.com/qa-gate",
          }),
        }),
      ]),
    );

    const optionsResponse = await page.request.get(
      `/api/teams/${team.key}/create-issue-options`,
    );
    expect(optionsResponse.status()).toBe(200);
    const optionsPayload = await optionsResponse.json();
    expect(optionsPayload.statuses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: `QA Gate ${suffix}`,
          behavior: expect.objectContaining({ terminalBehavior: "resolved" }),
        }),
      ]),
    );
  });
});
