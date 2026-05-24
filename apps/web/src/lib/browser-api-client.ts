"use client";

import { createExponentialClient } from "@exponential/sdk";

export function createBrowserApiClient() {
  return createExponentialClient({ baseUrl: "/api" });
}
