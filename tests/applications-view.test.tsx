import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import ApplicationsSettingsPage from "@/app/(app)/settings/applications/page";

describe("ApplicationsSettingsPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the applications settings page with empty state", async () => {
    render(<ApplicationsSettingsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("Applications")).toBeInTheDocument();
      expect(screen.getByText(/Manage third-party applications/)).toBeInTheDocument();
      expect(screen.getByText("No applications")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
