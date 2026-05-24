#!/usr/bin/env node
import { readFileSync } from "node:fs";

const browserClient = readFileSync(
  "apps/web/src/lib/browser-api-client.ts",
  "utf8",
);
if (!browserClient.includes('from "@exponential/sdk"')) {
  throw new Error("apps/web browser API client must use @exponential/sdk");
}
if (!browserClient.includes('baseUrl: "/api"')) {
  throw new Error(
    "apps/web browser API client must target the same-origin /api prefix",
  );
}

const agentDashboard = readFileSync(
  "apps/web/src/components/agent-dashboard.tsx",
  "utf8",
);
if (!agentDashboard.includes("createBrowserApiClient")) {
  throw new Error(
    "AgentDashboard must consume the generated SDK browser client",
  );
}
for (const forbidden of [
  'fetch("/api/agent/runs"',
  "fetch('/api/agent/runs'",
  "`/api/agent/runs/",
]) {
  if (agentDashboard.includes(forbidden)) {
    throw new Error(
      `AgentDashboard still contains direct agent API fetch: ${forbidden}`,
    );
  }
}

console.log("Web runtime SDK usage guard passed.");
