import { expect, test } from "@playwright/test";

test.describe("Canonical inbox notifications", () => {
  test("API returns seeded read notification history for the test session", async ({
    page,
  }) => {
    await page.goto("/foreverbrowsing/inbox");

    const payload = await page.evaluate(async () => {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      return response.json() as Promise<{
        notifications: Array<{
          actorName: string;
          issueIdentifier: string;
          issueTitle: string;
          readAt: string | null;
          type: string;
        }>;
        unreadCount: number;
      }>;
    });

    expect(payload.unreadCount).toBe(0);
    expect(payload.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorName: "Ashley Ha",
          issueIdentifier: "ENG-179",
          issueTitle: "Issue added to FOREVER-AGENT",
          readAt: expect.any(String),
          type: "status_change",
        }),
        expect.objectContaining({
          actorName: "Ashley Ha",
          issueIdentifier: "ENG-136",
          readAt: expect.any(String),
          type: "assigned",
        }),
      ]),
    );
  });

  test("renders Linear-style all-read notification history instead of empty state", async ({
    page,
  }) => {
    await page.goto("/foreverbrowsing/inbox");

    await expect(page.getByText("You're all caught up")).not.toBeVisible();
    await expect(page.getByText("ENG-179").first()).toBeVisible();
    await expect(
      page.getByText("Issue added to FOREVER-AGENT").first(),
    ).toBeVisible();
    await expect(page.getByText("ENG-136").first()).toBeVisible();
    await expect(
      page.getByText("assigned the issue to you").first(),
    ).toBeVisible();
    await expect(page.getByText("No unread notifications")).toBeVisible();
  });

  test("notification row click opens the notification deep link", async ({
    page,
  }) => {
    await page.goto("/foreverbrowsing/inbox");

    const row = page
      .getByTestId("notification-row")
      .filter({ hasText: "ENG-179" })
      .first();
    await expect(row).toBeVisible();

    await row.click();

    await expect(page).toHaveURL(
      /\/foreverbrowsing\/inbox\/notification\/[0-9a-f-]+$/,
    );
    await expect(page.getByText("ENG-179").first()).toBeVisible();
    await expect(
      page.getByText("Issue added to FOREVER-AGENT").first(),
    ).toBeVisible();
  });

  test("notification row keyboard activation opens the notification deep link", async ({
    page,
  }) => {
    await page.goto("/foreverbrowsing/inbox");

    const row = page
      .getByTestId("notification-row")
      .filter({ hasText: "ENG-179" })
      .first();
    await expect(row).toBeVisible();

    await row.focus();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(
      /\/foreverbrowsing\/inbox\/notification\/[0-9a-f-]+$/,
    );
  });

  test("deep link supports read and unread management after reload", async ({
    page,
  }) => {
    await page.goto("/foreverbrowsing/inbox");

    const payload = await page.evaluate(async () => {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      return response.json() as Promise<{
        notifications: Array<{
          id: string;
          issueIdentifier: string;
          type: string;
        }>;
      }>;
    });
    const target = payload.notifications.find(
      (notification) =>
        notification.issueIdentifier === "ENG-179" &&
        notification.type !== "comment",
    );
    expect(target).toBeTruthy();

    await page.evaluate(async (id) => {
      await fetch(`/api/notifications/${id}/unread`, {
        method: "PATCH",
        credentials: "include",
      });
    }, target?.id);

    await page.goto(`/foreverbrowsing/inbox/notification/${target?.id}`);
    await expect(page.getByText("1 unread")).toBeVisible();
    await expect(
      page.getByRole("heading").filter({ hasText: /Issue added/ }),
    ).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(
      new RegExp(`/foreverbrowsing/inbox/notification/${target?.id}$`),
    );
    await expect(
      page.getByRole("button", { name: "Mark notification read" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mark notification read" }).click();
    await expect(page.getByText("1 unread")).not.toBeVisible();
  });

  test("Open issue CTA navigates from workspace inbox to selected issue detail", async ({
    page,
  }) => {
    await page.goto("/foreverbrowsing/inbox");

    await expect(page.getByText("ENG-179").first()).toBeVisible();
    await expect(
      page.getByText("Issue added to FOREVER-AGENT").first(),
    ).toBeVisible();

    const openIssueLink = page.getByRole("link", { name: "Open issue" });
    await expect(openIssueLink).toHaveAttribute(
      "href",
      "/foreverbrowsing/issue/ENG-179",
    );

    await openIssueLink.click();

    await expect(page).toHaveURL(/\/foreverbrowsing\/issue\/ENG-179$/);
    await expect(page.getByText("ENG-179").first()).toBeVisible();
    await expect(
      page.getByText("Issue added to FOREVER-AGENT").first(),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Inbox" })).toHaveCount(0);
    await expect(
      page.getByText("This page could not be found"),
    ).not.toBeVisible();
  });
});
