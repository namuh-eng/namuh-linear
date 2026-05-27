// Load the monorepo-root .env into process.env before Next reads its own env.
// Next's loader only sees apps/web/.env* by default; this keeps a single
// source of truth at the repo root. apps/web/.env.local still wins for
// personal overrides because Next loads it after this runs (existing values
// in process.env are not overwritten).
{
  const fs = require("node:fs");
  const path = require("node:path");
  const rootEnv = path.resolve(__dirname, "../../.env");
  if (fs.existsSync(rootEnv)) {
    for (const line of fs.readFileSync(rootEnv, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    if (process.env.EXPONENTIAL_HEADLESS_DIRECT_API_REWRITE === "false") {
      return [];
    }

    const apiUrl = process.env.EXPONENTIAL_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      return [];
    }

    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
