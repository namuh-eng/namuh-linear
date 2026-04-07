import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import SettingsLayout from "@/app/(app)/settings/layout";

// Track current pathname for tests
let currentPathname = "/settings/account/preferences";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => currentPathname,
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Settings Layout Shell", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    currentPathname = "/settings/account/preferences";
  });

  it("renders 'Back to app' link", () => {
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    const backLink = screen.getByText("Back to app");
    expect(backLink.closest("a")).toHaveAttribute("href", "/");
  });

  it("renders Settings heading", () => {
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
  });

  it("renders all section headers", () => {
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("Administration")).toBeInTheDocument();
  });

  it("renders Account section navigation links", () => {
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    expect(screen.getByText("Preferences")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    // "Notifications" link in sidebar
    const notifLinks = screen.getAllByText("Notifications");
    expect(notifLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Administration section links", () => {
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
  });

  it("highlights active page in sidebar", () => {
    currentPathname = "/settings/account/profile";
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    const profileLink = screen.getByText("Profile").closest("a");
    expect(profileLink?.className).toContain(
      "bg-[var(--color-surface-active)]",
    );

    const prefsLink = screen.getByText("Preferences").closest("a");
    expect(prefsLink?.className).not.toContain(
      "bg-[var(--color-surface-active)]",
    );
  });

  it("renders children in content area", () => {
    render(
      <SettingsLayout>
        <div data-testid="test-content">Test Content</div>
      </SettingsLayout>,
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders Issues section with Labels link", () => {
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    // Labels appears in both Issues and Projects sections
    const labelLinks = screen.getAllByText("Labels");
    expect(labelLinks.length).toBe(2);
  });

  it("renders Features section links", () => {
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    expect(screen.getByText("AI & Agents")).toBeInTheDocument();
    expect(screen.getByText("Integrations")).toBeInTheDocument();
  });
});
