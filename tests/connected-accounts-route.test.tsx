import ConnectedAccountsRedirectPage from "@/app/(app)/settings/account/connected/page";
import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (href: string) => redirectMock(href),
}));

describe("Connected accounts route canonicalization", () => {
  it("redirects the legacy /connected route to Linear's canonical /connections route", () => {
    ConnectedAccountsRedirectPage();

    expect(redirectMock).toHaveBeenCalledWith("/settings/account/connections");
  });
});
