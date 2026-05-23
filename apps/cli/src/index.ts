#!/usr/bin/env node
import { createExponentialClient, syncWebSocketUrl } from "@exponential/sdk";
import { parseIssueBody, readOption, requireOption } from "./args.js";

const [resource, action = "list", ...args] = process.argv.slice(2);
const token = process.env.EXPONENTIAL_TOKEN;
const baseUrl = process.env.EXPONENTIAL_API_URL ?? "http://localhost:3016/v1";

if (!token) {
  console.error("EXPONENTIAL_TOKEN is required");
  process.exit(1);
}

const apiToken = token;
const client = createExponentialClient({ token: apiToken, baseUrl });
const idempotencyKey = readOption(args, "idempotency-key");

async function main() {
  if (resource !== "issues") {
    usage();
  }

  if (action === "list") {
    const { data, error, response } = await client.GET("/issues", {
      params: {
        query: {
          cursor: readOption(args, "cursor"),
          limit: readOption(args, "limit")
            ? Number(readOption(args, "limit"))
            : undefined,
          team_id: readOption(args, "team-id"),
        },
      },
    });
    printResult(data, error, response.status);
    return;
  }

  if (action === "get") {
    const id = requireOption(args, "id");
    const { data, error, response } = await client.GET("/issues/{id}", {
      params: { path: { id } },
    });
    printResult(data, error, response.status);
    return;
  }

  if (action === "create") {
    const body = parseIssueBody(args);
    if (!body.title || !body.team_id) {
      throw new Error("--title and --team-id are required");
    }
    const { data, error, response } = await client.POST("/issues", {
      headers: { "Idempotency-Key": idempotencyKey },
      body: { ...body, title: body.title, team_id: body.team_id },
    });
    printResult(data, error, response.status);
    return;
  }

  if (action === "update") {
    const id = requireOption(args, "id");
    const body = parseIssueBody(args);
    const { data, error, response } = await client.PATCH("/issues/{id}", {
      params: { path: { id } },
      headers: { "Idempotency-Key": idempotencyKey },
      body: Object.fromEntries(
        Object.entries(body).filter(
          ([, value]) => value !== undefined && value !== null,
        ),
      ),
    });
    printResult(data, error, response.status);
    return;
  }

  if (action === "delete") {
    const id = requireOption(args, "id");
    const { data, error, response } = await client.DELETE("/issues/{id}", {
      params: { path: { id } },
      headers: { "Idempotency-Key": idempotencyKey },
    });
    printResult(data, error, response.status);
    return;
  }

  if (action === "watch") {
    console.log(
      JSON.stringify({
        url: syncWebSocketUrl({
          baseUrl,
          token: apiToken,
          version: readOption(args, "version")
            ? Number(readOption(args, "version"))
            : 0,
        }),
      }),
    );
    return;
  }

  usage();
}

function printResult(data: unknown, error: unknown, status: number) {
  if (error) {
    console.error(JSON.stringify({ status, error }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
}

function usage(): never {
  console.error(`Usage:
  exponential issues list [--team-id <uuid>] [--cursor <cursor>] [--limit <n>]
  exponential issues get --id <id-or-identifier>
  exponential issues create --title <title> --team-id <uuid> [--idempotency-key <key>]
  exponential issues update --id <id-or-identifier> [--title <title>] [--state-id <uuid>]
  exponential issues delete --id <id-or-identifier> [--idempotency-key <key>]
  exponential issues watch [--version <n>]`);
  process.exit(1);
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
