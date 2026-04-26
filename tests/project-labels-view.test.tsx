import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import ProjectLabelsPage from "@/app/(app)/settings/project-labels/page";

describe("ProjectLabelsPage component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the project labels settings page with empty state", async () => {
    render(<ProjectLabelsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText("Project labels")).toBeInTheDocument();
      expect(screen.getByText(/manage labels specifically for projects/)).toBeInTheDocument();
      expect(screen.getByText("No project labels")).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
