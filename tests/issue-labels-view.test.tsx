import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import IssueLabelsPage from "@/app/(app)/settings/issue-labels/page";

const mockLabels = [
  {
    id: "l-1",
    name: "Bug",
    color: "#e5484d",
    description: "Something is broken",
    parentLabelId: null,
    issueCount: 5,
    lastApplied: "2024-04-26T10:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "l-2",
    name: "Feature",
    color: "#3b82f6",
    description: null,
    parentLabelId: null,
    issueCount: 12,
    lastApplied: null,
    createdAt: "2024-02-01T00:00:00Z",
  },
];

describe("IssueLabelsPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then label list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ labels: mockLabels }),
    }));

    render(<IssueLabelsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.getByText("Something is broken")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Add label description...")).toBeInTheDocument();
  });

  it("filters labels by name", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ labels: mockLabels }),
    }));

    render(<IssueLabelsPage />);
    await waitFor(() => screen.getByText("Bug"));

    const filterInput = screen.getByPlaceholderText("Filter by name...");
    fireEvent.change(filterInput, { target: { value: "bug" } });

    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(screen.queryByText("Feature")).not.toBeInTheDocument();
  });

  it("opens create label modal and submits new label", async () => {
    const fetchMock = vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ labels: mockLabels }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ labels: [...mockLabels, { id: "l-3", name: "Improvement", color: "#6b6f76", description: "Enhancement", issueCount: 0, createdAt: new Date().toISOString() }] }),
      })
    );

    render(<IssueLabelsPage />);
    await waitFor(() => screen.getByText("Bug"));

    fireEvent.click(screen.getByText("New label"));
    expect(screen.getByRole("heading", { name: "Create label" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Label name"), { target: { value: "Improvement" } });
    fireEvent.change(screen.getByPlaceholderText("Add label description..."), { target: { value: "Enhancement" } });
    
    fireEvent.click(screen.getByRole("button", { name: "Create label" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/labels", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"name":"Improvement"'),
      }));
    });

    await waitFor(() => screen.getByText("Improvement"));
  });

  it("deletes a label after confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    const fetchMock = vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ labels: mockLabels }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
    );

    render(<IssueLabelsPage />);
    await waitFor(() => screen.getByText("Bug"));

    const deleteBtn = screen.getByLabelText("Delete Bug");
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith("Delete Bug?");
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/labels/l-1", expect.objectContaining({
        method: "DELETE",
      }));
    });

    expect(screen.queryByText("Bug")).not.toBeInTheDocument();
  });

  it("updates label description inline", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ labels: mockLabels }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
    );

    render(<IssueLabelsPage />);
    await waitFor(() => screen.getByText("Bug"));

    fireEvent.click(screen.getByText("Something is broken"));
    const input = screen.getByDisplayValue("Something is broken");
    fireEvent.change(input, { target: { value: "Updated description" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/labels/l-1", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"description":"Updated description"'),
      }));
    });
    
    expect(screen.getByText("Updated description")).toBeInTheDocument();
  });
});
