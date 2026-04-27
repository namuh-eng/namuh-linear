import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProjectStatusesPage from "@/app/(app)/settings/project-statuses/page";
import { afterEach, describe, expect, it } from "vitest";

describe("ProjectStatusesPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the project statuses settings page with empty state", async () => {
    render(<ProjectStatusesPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText("Project statuses")).toBeInTheDocument();
        expect(
          screen.getByText(/Configure the lifecycle stages for projects/),
        ).toBeInTheDocument();
        expect(screen.getByText("No custom statuses")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
