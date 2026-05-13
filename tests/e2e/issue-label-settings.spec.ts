import { expect, test } from "@playwright/test";

test.describe("Issue label settings", () => {
  test("supports slug route, sidebar link, command palette, and label CRUD", async ({
    page,
  }) => {
    const suffix = Date.now().toString(36);
    const workspaceSlug = `issue-labels-${suffix}`;
    const workspaceResponse = await page.request.post("/api/workspaces", {
      data: {
        name: `Issue Labels ${suffix}`,
        urlSlug: workspaceSlug,
      },
    });
    expect(workspaceResponse.status()).toBe(201);

    await page.goto(`/${workspaceSlug}/settings`);
    const issueLabelsLink = page.locator(
      `a[href="/${workspaceSlug}/settings/issue-labels"]`,
    );
    await expect(issueLabelsLink).toBeVisible();
    await issueLabelsLink.click();
    await expect(page).toHaveURL(
      new RegExp(`/${workspaceSlug}/settings/issue-labels$`),
    );
    await expect(
      page.getByRole("heading", { name: "Issue labels" }),
    ).toBeVisible();
    await expect(
      page.getByText("This page could not be found"),
    ).not.toBeVisible();

    await page.getByRole("button", { name: "New label" }).click();
    const labelName = `Bug ${suffix}`;
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(labelName);
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("Initial issue label");
    await page.getByRole("button", { name: "Color #3b82f6" }).click();
    await page.getByRole("button", { name: "Create label" }).click();
    await expect(page.getByText(labelName)).toBeVisible();
    await expect(page.getByText("Initial issue label")).toBeVisible();

    await page.getByRole("button", { name: `Edit ${labelName}` }).click();
    const editedName = `Defect ${suffix}`;
    await page
      .getByRole("textbox", { name: "Name", exact: true })
      .fill(editedName);
    await page
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("Edited issue label");
    await page.getByRole("button", { name: "Color #e5484d" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(editedName)).toBeVisible();
    await expect(page.getByText("Edited issue label")).toBeVisible();

    await page.reload();
    await expect(page.getByText(editedName)).toBeVisible();
    await expect(page.getByText("Edited issue label")).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${editedName}` }).click();
    await expect(page.getByText(editedName)).toHaveCount(0);

    await page.getByLabel("Search").click();
    await page
      .getByPlaceholder("Type a command or search...")
      .fill("create label");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(
      new RegExp(`/${workspaceSlug}/settings/issue-labels$`),
    );
  });
});
