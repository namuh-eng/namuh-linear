import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TeamSlackSettingsPage from "../src/app/(app)/settings/teams/[key]/slack-notifications/page";

// Mock useParams
vi.mock("next/navigation", () => ({
  useParams: () => ({ key: "ENG" }),
}));

describe("TeamSlackSettingsPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the disconnected Slack state", () => {
    render(<TeamSlackSettingsPage />);

    expect(screen.getByText("Slack notifications")).toBeDefined();
    expect(screen.getByText("Slack is not connected")).toBeDefined();
    expect(screen.getByRole("button", { name: "Connect Slack" })).toBeDefined();
    expect(screen.getByText("Back to team settings")).toBeDefined();
  });
});