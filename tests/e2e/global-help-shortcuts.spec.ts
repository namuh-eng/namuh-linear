import { expect, test } from "@playwright/test";

async function prepareShortcutTarget(page: import("@playwright/test").Page) {
  await page.goto("/foreverbrowsing/team/ENG/all");
  await expect(page.getByLabel("Help")).toBeVisible();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    document.body.focus();
  });
}

test.describe("Global help and shortcuts", () => {
  test("help menu exposes clone-safe support resources", async ({ page }) => {
    await prepareShortcutTarget(page);

    await page
      .getByLabel("Help")
      .evaluate((button) => (button as HTMLButtonElement).click());

    for (const label of [
      "Help center / Docs",
      "Contact support",
      "System status",
      "Changelog / What's new",
      "Download apps",
      "Community",
    ]) {
      await expect(
        page.getByRole("link", { name: new RegExp(label, "i") }),
      ).toBeVisible();
    }

    const helpCenter = page.getByRole("link", { name: /Help center \/ Docs/i });
    await expect(helpCenter).toHaveAttribute(
      "href",
      "/foreverbrowsing/help#help-center",
    );
    await expect(helpCenter).not.toHaveAttribute("href", /linear\.app/);
  });

  test("slash opens shortcuts outside editable targets and is ignored while typing", async ({
    page,
  }) => {
    await prepareShortcutTarget(page);

    await page.keyboard.press("/");
    await expect(
      page.getByRole("heading", { name: "Keyboard shortcuts" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("heading", { name: "Keyboard shortcuts" }),
    ).not.toBeVisible();

    await page.evaluate(() => {
      const input = document.createElement("input");
      input.setAttribute("aria-label", "Shortcut suppression input");
      document.body.appendChild(input);
      input.focus();
    });
    await page.keyboard.press("/");
    await expect(
      page.getByRole("heading", { name: "Keyboard shortcuts" }),
    ).not.toBeVisible();
  });
});
