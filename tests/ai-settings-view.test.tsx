import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import AISettingsPage from "@/app/(app)/settings/ai/page";

describe("AISettingsPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the AI settings page with empty state", async () => {
    render(<AISettingsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("AI & Agents")).toBeInTheDocument();
      expect(screen.getByText(/Configure workspace-wide AI features/)).toBeInTheDocument();
      expect(screen.getByText("AI features are enabled")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
