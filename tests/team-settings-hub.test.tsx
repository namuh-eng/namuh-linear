import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/settings/teams/ENG",
  useParams: () => ({ key: "ENG" }),
}));

const mockTeam = {
  name: "Engineering",
  key: "ENG",
  icon: "🟣",
  memberCount: 2,
  labelCount: 11,
  statusCount: 16,
  triageEnabled: true,
  cyclesEnabled: false,
};

describe("TeamSettingsHubPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  async function renderPage() {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ team: mockTeam }),
      }),
    );

    const { default: TeamSettingsHub } = await import(
      "@/app/(app)/settings/teams/[key]/page"
    );
    render(<TeamSettingsHub />);
    await screen.findByText("Engineering");
  }

  it("renders team name", async () => {
    await renderPage();
    expect(screen.getByText("Engineering")).toBeDefined();
  });

  it("renders 'General' card with description", async () => {
    await renderPage();
    expect(screen.getByText("General")).toBeDefined();
    expect(screen.getByText(/identifier, timezone/i)).toBeDefined();
  });

  it("renders 'Members' card with count", async () => {
    await renderPage();
    expect(screen.getByText("Members")).toBeDefined();
    expect(screen.getByText("2 members")).toBeDefined();
  });

  it("renders 'Slack notifications' card", async () => {
    await renderPage();
    expect(screen.getByText("Slack notifications")).toBeDefined();
  });

  it("renders 'Issues, projects, and docs' section", async () => {
    await renderPage();
    expect(screen.getByText("Issues, projects, and docs")).toBeDefined();
  });

  it("renders 'Issue labels' card with count", async () => {
    await renderPage();
    expect(screen.getByText("Issue labels")).toBeDefined();
    expect(screen.getByText("11 labels")).toBeDefined();
  });

  it("renders 'Templates' card", async () => {
    await renderPage();
    expect(screen.getByText("Templates")).toBeDefined();
  });

  it("renders 'Recurring issues' card", async () => {
    await renderPage();
    expect(screen.getByText("Recurring issues")).toBeDefined();
  });

  it("renders 'Workflow' section", async () => {
    await renderPage();
    expect(screen.getByText("Workflow")).toBeDefined();
  });

  it("renders 'Issue statuses' card with count", async () => {
    await renderPage();
    expect(screen.getByText("Issue statuses")).toBeDefined();
    expect(screen.getByText("16 statuses")).toBeDefined();
  });

  it("renders 'Triage' card with enabled status", async () => {
    await renderPage();
    expect(screen.getByText("Triage")).toBeDefined();
    expect(screen.getByText("Enabled")).toBeDefined();
  });

  it("renders 'Cycles' card with off status", async () => {
    await renderPage();
    expect(screen.getByText("Cycles")).toBeDefined();
    expect(screen.getByText("Off")).toBeDefined();
  });

  it("renders 'AI' section with Agents and Discussion summaries", async () => {
    await renderPage();
    expect(screen.getByText("AI")).toBeDefined();
    expect(screen.getByText("Agents")).toBeDefined();
    expect(screen.getByText("Discussion summaries")).toBeDefined();
  });

  it("renders 'Danger zone' section", async () => {
    await renderPage();
    expect(screen.getByText("Danger zone")).toBeDefined();
  });

  it("renders Leave, Retire, Delete team buttons", async () => {
    await renderPage();
    expect(screen.getByText("Leave team")).toBeDefined();
    expect(screen.getByText("Retire team")).toBeDefined();
    expect(screen.getByText("Delete team")).toBeDefined();
  });
});
