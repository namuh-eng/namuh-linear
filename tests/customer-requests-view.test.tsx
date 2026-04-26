import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import CustomerRequestsSettingsPage from "@/app/(app)/settings/customer-requests/page";

describe("CustomerRequestsSettingsPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the customer requests settings page with empty state", async () => {
    render(<CustomerRequestsSettingsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("Customer requests")).toBeInTheDocument();
      expect(screen.getByText(/Manage how customer feedback/)).toBeInTheDocument();
      expect(screen.getByText("No requests configured")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
