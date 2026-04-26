import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import EmojisSettingsPage from "@/app/(app)/settings/emojis/page";

describe("EmojisSettingsPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the emojis settings page with empty state", async () => {
    render(<EmojisSettingsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("Custom emojis")).toBeInTheDocument();
      expect(screen.getByText(/Upload custom emojis/)).toBeInTheDocument();
      expect(screen.getByText("No custom emojis")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
