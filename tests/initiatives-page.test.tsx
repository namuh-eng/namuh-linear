import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import InitiativesPage from "@/app/(app)/initiatives/page";

describe("InitiativesPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("filters initiatives by active tab", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        initiatives: [
          {
            id: "init-active",
            name: "Ship desktop rewrite",
            description: "Active initiative",
            status: "active",
            projectCount: 2,
            completedProjectCount: 1,
            createdAt: "2026-04-01T00:00:00.000Z",
          },
          {
            id: "init-planned",
            name: "Plan growth experiments",
            description: "Planned initiative",
            status: "planned",
            projectCount: 0,
            completedProjectCount: 0,
            createdAt: "2026-04-02T00:00:00.000Z",
          },
        ],
      }),
    } as Response);

    render(<InitiativesPage />);

    await waitFor(() => {
      expect(screen.getByText("Ship desktop rewrite")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Plan growth experiments"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Planned" }));

    await waitFor(() => {
      expect(screen.getByText("Plan growth experiments")).toBeInTheDocument();
    });
    expect(screen.queryByText("Ship desktop rewrite")).not.toBeInTheDocument();
  });

  it("opens the create form on the N then I shortcut", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ initiatives: [] }),
    } as Response);

    render(<InitiativesPage />);

    await waitFor(() => {
      expect(screen.getByText("No initiatives")).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: "n" });
    fireEvent.keyDown(document, { key: "i" });

    expect(
      await screen.findByPlaceholderText("Initiative name"),
    ).toBeInTheDocument();
  });
});
