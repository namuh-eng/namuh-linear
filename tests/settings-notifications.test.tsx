import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import NotificationsSettingsPage from "@/app/(app)/settings/account/notifications/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/settings/account/notifications",
}));

describe("Account Notifications Page", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders Notifications heading", () => {
    render(<NotificationsSettingsPage />);
    expect(
      screen.getByRole("heading", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("renders notification channel cards", () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByText("Desktop")).toBeInTheDocument();
    expect(screen.getByText("Mobile")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Slack")).toBeInTheDocument();
  });

  it("shows enabled/disabled status on channels", () => {
    render(<NotificationsSettingsPage />);
    const enabledBadges = screen.getAllByText("Enabled");
    const disabledBadges = screen.getAllByText("Disabled");
    expect(enabledBadges).toHaveLength(2); // Desktop + Mobile
    expect(disabledBadges).toHaveLength(2); // Email + Slack
  });

  it("renders Updates from Linear section", () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByText("Updates from Linear")).toBeInTheDocument();
    expect(screen.getByText("Changelog")).toBeInTheDocument();
    expect(screen.getByText("Show in sidebar")).toBeInTheDocument();
    expect(screen.getByText("Newsletter")).toBeInTheDocument();
    expect(screen.getByText("Marketing")).toBeInTheDocument();
  });

  it("renders Other section with toggles", () => {
    render(<NotificationsSettingsPage />);
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText("Invite accepted")).toBeInTheDocument();
    expect(screen.getByText("Privacy and legal updates")).toBeInTheDocument();
    expect(screen.getByText("DPA")).toBeInTheDocument();
  });

  it("renders toggle switches", () => {
    render(<NotificationsSettingsPage />);
    const toggles = screen.getAllByRole("switch");
    expect(toggles.length).toBeGreaterThanOrEqual(6);
  });
});
