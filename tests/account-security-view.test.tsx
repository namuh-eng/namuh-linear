import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import AccountSecurityPage from "@/app/(app)/settings/account/security/page";

describe("AccountSecurityPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the account security settings page with empty state", async () => {
    render(<AccountSecurityPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("Account security")).toBeInTheDocument();
      expect(screen.getByText(/Manage your password/)).toBeInTheDocument();
      expect(screen.getByText("Two-factor authentication")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
