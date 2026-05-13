import { expect, test } from "@playwright/test";

test.describe("Canonical Forever Browsing routes", () => {
  test("renders canonical workspace/team deep links and redirects legacy ENG route", async ({
    page,
  }) => {
    await page.goto("/foreverbrowsing/inbox");
    await expect(page).toHaveURL(/\/foreverbrowsing\/inbox$/);
    await expect(page.getByText("Inbox").first()).toBeVisible();
    await expect(
      page.getByText("This page could not be found"),
    ).not.toBeVisible();

    await page.goto("/foreverbrowsing/team/ENG/all");
    await expect(page).toHaveURL(/\/foreverbrowsing\/team\/ENG\/all$/);
    await expect(
      page.getByText(
        "The team ENG doesn't exist or you don't have access to it.",
      ),
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: /All issues|No issues/ }),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/foreverbrowsing/team/ENG/all"]').first(),
    ).toHaveAttribute("href", "/foreverbrowsing/team/ENG/all");

    await page.goto("/foreverbrowsing/team/ENG/board");
    await expect(page).toHaveURL(/\/foreverbrowsing\/team\/ENG\/board$/);
    await expect(
      page.getByText(
        "The team ENG doesn't exist or you don't have access to it.",
      ),
    ).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: /No issues|Backlog|Todo|In Progress/ }),
    ).toBeVisible();
    await expect(
      page.getByText("This page could not be found"),
    ).not.toBeVisible();

    await page.goto("/foreverbrowsing/team/ENG/cycles");
    await expect(page).toHaveURL(/\/foreverbrowsing\/team\/ENG\/cycles$/);
    await expect(
      page.getByText(
        "The team ENG doesn't exist or you don't have access to it.",
      ),
    ).not.toBeVisible();
    await expect(page.getByText("Cycles").first()).toBeVisible();

    await page.goto("/team/ENG/board");
    await expect(page).toHaveURL(/\/foreverbrowsing\/team\/ENG\/board$/);
    await expect(
      page.getByText("This page could not be found"),
    ).not.toBeVisible();
  });
});
