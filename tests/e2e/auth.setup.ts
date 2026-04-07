import { mkdirSync } from "node:fs";
import { expect, test as setup } from "@playwright/test";
import { Client } from "pg";
import ralphConfig from "../../ralph-config.json";

const authFile = "tests/e2e/.auth/user.json";
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/namuh_linear";

async function readLatestMagicLinkToken(email: string) {
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const result = await client.query(
        `
          select value
          from verification
          where identifier = $1
          order by created_at desc nulls last
          limit 1
        `,
        [email],
      );

      const token = result.rows[0]?.value as string | undefined;
      if (token) {
        return token;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } finally {
    await client.end();
  }

  return null;
}

setup("authenticate playwright browser", async ({ page }) => {
  const email = process.env.TEST_ACCOUNT_EMAIL ?? "test@example.com";
  expect(email).toBeTruthy();

  const callbackURL = "http://localhost:3015/inbox";
  const errorCallbackURL = "http://localhost:3015/login?callbackUrl=%2Finbox";

  await page.goto("/login?callbackUrl=%2Finbox");
  await page.getByRole("button", { name: /continue with email/i }).click();
  await page.getByPlaceholder("Enter your email address...").fill(email ?? "");
  await page.getByRole("button", { name: /^continue with email$/i }).click();

  await expect(page.getByPlaceholder("Enter 6-digit code")).toBeVisible();

  const token = await readLatestMagicLinkToken(email ?? "");
  expect(token).toBeTruthy();

  await page.goto(
    `http://localhost:3015/api/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent(
      callbackURL,
    )}&errorCallbackURL=${encodeURIComponent(errorCallbackURL)}`,
  );

  await expect
    .poll(async () => {
      return page.evaluate(async () => {
        const sessionResponse = await fetch("/api/auth/get-session", {
          credentials: "include",
        });

        if (!sessionResponse.ok) {
          return null;
        }

        const data = (await sessionResponse.json()) as {
          user?: { email?: string | null };
        } | null;

        return data?.user?.email ?? null;
      });
    })
    .toBe(email);

  mkdirSync("tests/e2e/.auth", { recursive: true });
  await page.context().storageState({ path: authFile });
});
