import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import DocumentsSettingsPage from "@/app/(app)/settings/documents/page";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

describe("DocumentsSettingsPage component", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        documents: {
          defaultVisibility: "workspace",
          autoLinkProjectDocuments: true,
          templates: [],
          folders: [],
        },
      }),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders actionable empty states for templates and common folders", async () => {
    render(<DocumentsSettingsPage />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    expect(await screen.findByText("Documents")).toBeInTheDocument();
    expect(
      screen.getByText(/Configure document templates/),
    ).toBeInTheDocument();
    expect(screen.getByText("Document templates")).toBeInTheDocument();
    expect(screen.getByText("Common folders")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "New template" }),
    ).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "New folder" })).toHaveLength(
      2,
    );
  });

  it("renders workspace defaults controls", async () => {
    render(<DocumentsSettingsPage />);

    expect(await screen.findByText("Documents")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Default document visibility"),
    ).toHaveValue("workspace");
    expect(
      screen.getByLabelText(/Auto-link project documents/),
    ).toBeChecked();
  });

  it("persists workspace document defaults", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: {
            defaultVisibility: "workspace",
            autoLinkProjectDocuments: true,
            templates: [],
            folders: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: {
            defaultVisibility: "private",
            autoLinkProjectDocuments: true,
            templates: [],
            folders: [],
          },
        }),
      });

    render(<DocumentsSettingsPage />);
    const visibility = await screen.findByLabelText(
      "Default document visibility",
    );

    fireEvent.change(visibility, { target: { value: "private" } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/document-settings",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ defaultVisibility: "private" }),
        }),
      );
    });
  });

  it("loads persisted templates and folders", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        documents: {
          defaultVisibility: "workspace",
          autoLinkProjectDocuments: true,
          templates: [
            {
              id: "template-1",
              name: "Weekly update",
              description: "Status report",
              content: "Wins\nRisks\nNext steps",
              createdAt: "2026-05-20T00:00:00.000Z",
              updatedAt: "2026-05-20T00:00:00.000Z",
            },
          ],
          folders: [
            {
              id: "folder-1",
              name: "Handbook",
              description: "Company operating docs",
              color: "blue",
              createdAt: "2026-05-20T00:00:00.000Z",
              updatedAt: "2026-05-20T00:00:00.000Z",
            },
          ],
        },
      }),
    });

    render(<DocumentsSettingsPage />);

    expect(await screen.findByText("Weekly update")).toBeInTheDocument();
    expect(screen.getByText(/Wins/)).toBeInTheDocument();
    expect(screen.getByText("Handbook")).toBeInTheDocument();
    expect(screen.getByText("blue folder")).toBeInTheDocument();
  });

  it("validates, creates, edits, and deletes a document template", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: {
            defaultVisibility: "workspace",
            autoLinkProjectDocuments: true,
            templates: [],
            folders: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          template: {
            id: "template-1",
            name: "Spec template",
            description: "Product specs",
            content: "Problem\nProposal",
            createdAt: "2026-05-20T00:00:00.000Z",
            updatedAt: "2026-05-20T00:00:00.000Z",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          template: {
            id: "template-1",
            name: "Edited spec template",
            description: "Product specs",
            content: "Problem\nProposal\nDecision",
            createdAt: "2026-05-20T00:00:00.000Z",
            updatedAt: "2026-05-20T01:00:00.000Z",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<DocumentsSettingsPage />);

    fireEvent.click(
      (await screen.findAllByRole("button", { name: "New template" }))[0],
    );
    expect(
      screen.getByRole("dialog", { name: "Create document template" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    expect(
      await screen.findByText("Template name is required."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Template name"), {
      target: { value: "Spec template" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save template" }));
    expect(
      await screen.findByText("Template content is required."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Product specs" },
    });
    fireEvent.change(screen.getByLabelText("Template content"), {
      target: { value: "Problem\nProposal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save template" }));

    expect(await screen.findByText("Spec template")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/document-templates",
      expect.objectContaining({ method: "POST" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Template name"), {
      target: { value: "Edited spec template" },
    });
    fireEvent.change(screen.getByLabelText("Template content"), {
      target: { value: "Problem\nProposal\nDecision" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save template" }));

    expect(await screen.findByText("Edited spec template")).toBeInTheDocument();
    expect(screen.getByText(/Decision/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(
        screen.queryByText("Edited spec template"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("No document templates")).toBeInTheDocument();
  });

  it("creates, edits, and deletes a common folder", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          documents: {
            defaultVisibility: "workspace",
            autoLinkProjectDocuments: true,
            templates: [],
            folders: [],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folder: {
            id: "folder-1",
            name: "Runbooks",
            description: "Operational docs",
            color: "green",
            createdAt: "2026-05-20T00:00:00.000Z",
            updatedAt: "2026-05-20T00:00:00.000Z",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          folder: {
            id: "folder-1",
            name: "Team runbooks",
            description: "Operational docs",
            color: "purple",
            createdAt: "2026-05-20T00:00:00.000Z",
            updatedAt: "2026-05-20T01:00:00.000Z",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<DocumentsSettingsPage />);

    fireEvent.click(
      (await screen.findAllByRole("button", { name: "New folder" }))[0],
    );
    fireEvent.click(screen.getByRole("button", { name: "Save folder" }));
    expect(
      await screen.findByText("Folder name is required."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Folder name"), {
      target: { value: "Runbooks" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Operational docs" },
    });
    fireEvent.change(screen.getByLabelText("Folder color"), {
      target: { value: "green" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save folder" }));

    expect(await screen.findByText("Runbooks")).toBeInTheDocument();
    expect(screen.getByText("green folder")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Folder name"), {
      target: { value: "Team runbooks" },
    });
    fireEvent.change(screen.getByLabelText("Folder color"), {
      target: { value: "purple" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save folder" }));

    expect(await screen.findByText("Team runbooks")).toBeInTheDocument();
    expect(screen.getByText("purple folder")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.queryByText("Team runbooks")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("No common folders")).toBeInTheDocument();
  });

  it("shows a recoverable load error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "boom" }),
    });

    render(<DocumentsSettingsPage />);

    expect(
      await screen.findByText("Unable to load document settings."),
    ).toBeInTheDocument();
  });
});
