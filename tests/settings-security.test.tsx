import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/settings/security",
}));

describe("SecuritySettingsPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  async function renderPage() {
    const { default: SecurityPage } = await import(
      "@/app/(app)/settings/security/page"
    );
    render(<SecurityPage />);
  }

  it("renders page title 'Security'", async () => {
    await renderPage();
    expect(screen.getByText("Security")).toBeDefined();
  });

  it("renders 'Workspace access' section header", async () => {
    await renderPage();
    expect(screen.getByText("Workspace access")).toBeDefined();
  });

  it("renders invite links section with description", async () => {
    await renderPage();
    expect(screen.getByText("Invite links")).toBeDefined();
    expect(screen.getByText(/uniquely generated invite link/i)).toBeDefined();
  });

  it("renders 'Enable invite links' toggle", async () => {
    await renderPage();
    expect(screen.getByText("Enable invite links")).toBeDefined();
  });

  it("renders invite URL with Copy button when enabled", async () => {
    await renderPage();
    expect(screen.getByText("Copy")).toBeDefined();
  });

  it("renders 'Workspace login and restrictions' section", async () => {
    await renderPage();
    expect(screen.getByText("Workspace login and restrictions")).toBeDefined();
  });

  it("renders approved email domains with 'Add domain' button", async () => {
    await renderPage();
    expect(screen.getByText(/approved email domains/i)).toBeDefined();
    expect(screen.getByText("Add domain")).toBeDefined();
  });

  it("renders 'Authentication methods' section header", async () => {
    await renderPage();
    expect(screen.getByText("Authentication methods")).toBeDefined();
  });

  it("renders admin/guest note about authentication", async () => {
    await renderPage();
    expect(
      screen.getByText(/admins and guests can always authenticate/i),
    ).toBeDefined();
  });

  it("renders Google authentication toggle", async () => {
    await renderPage();
    expect(screen.getByText("Google authentication")).toBeDefined();
  });

  it("renders Email & passkey authentication toggle", async () => {
    await renderPage();
    expect(screen.getByText("Email & passkey authentication")).toBeDefined();
  });

  it("renders 'Workspace management' section", async () => {
    await renderPage();
    expect(screen.getByText("Workspace management")).toBeDefined();
  });

  it("renders permission selectors for workspace management", async () => {
    await renderPage();
    expect(screen.getByText("New user invitations")).toBeDefined();
    expect(screen.getByText("Team creation")).toBeDefined();
    expect(screen.getByText("Manage workspace labels")).toBeDefined();
    expect(screen.getByText("API key creation")).toBeDefined();
  });

  it("renders AI section with toggles", async () => {
    await renderPage();
    expect(screen.getByText("AI")).toBeDefined();
    expect(screen.getByText("Improve AI")).toBeDefined();
    expect(screen.getByText("Enable web search")).toBeDefined();
  });

  it("renders Compliance section with HIPAA toggle", async () => {
    await renderPage();
    expect(screen.getByText("Compliance")).toBeDefined();
    expect(screen.getByText("HIPAA compliance")).toBeDefined();
  });

  it("renders 'Restrict file uploads' toggle", async () => {
    await renderPage();
    expect(screen.getByText("Restrict file uploads")).toBeDefined();
  });

  it("toggles invite links on/off", async () => {
    await renderPage();
    const toggle = screen.getByRole("switch", {
      name: /enable invite links/i,
    });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });
});
