import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    },
  },
  plugins: [
    magicLink({
      generateToken: async () =>
        randomInt(0, 1_000_000).toString().padStart(6, "0"),
      sendMagicLink: async ({ email, url, token }) => {
        await sendMagicLinkEmail(email, token, url);
      },
      expiresIn: 600, // 10 minutes
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});
