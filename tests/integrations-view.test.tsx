import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import IntegrationsSettingsPage from "@/app/(app)/settings/integrations/page";

describe("IntegrationsSettingsPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the integrations settings page with empty state", async () => {
    render(<IntegrationsSettingsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("Integrations")).toBeInTheDocument();
      expect(screen.getByText(/Connect your workspace with GitHub/)).toBeInTheDocument();
      expect(screen.getByText("No active integrations")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
