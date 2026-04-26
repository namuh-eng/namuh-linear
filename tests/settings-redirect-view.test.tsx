import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "@/app/(app)/settings/page";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe("SettingsPage component", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders redirecting message and calls router.replace", async () => {
    render(<SettingsPage />);
    
    expect(screen.getByText("Redirecting...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/settings/account/preferences");
    });
  });
});
