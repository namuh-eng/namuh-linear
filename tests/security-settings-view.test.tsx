import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import SecurityPage from "@/app/(app)/settings/security/page";

const mockSecurityData = {
  inviteLinkEnabled: true,
  inviteUrl: "https://linear.app/join/workspace-123",
  approvedEmailDomains: ["acme.com"],
  authentication: {
    google: true,
    emailPasskey: true,
  },
  permissions: {
    invitationsRole: "admins",
    teamCreationRole: "members",
    labelManagementRole: "members",
    templateManagementRole: "admins",
    apiKeyCreationRole: "admins",
    agentGuidanceRole: "admins",
  },
  restrictFileUploads: false,
  improveAi: true,
  webSearch: false,
  hipaa: false,
};

describe("SecurityPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then security settings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ security: mockSecurityData }),
    }));

    render(<SecurityPage />);
    expect(screen.getByText("Loading security settings...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading security settings...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Security")).toBeInTheDocument();
    expect(screen.getByText("acme.com")).toBeInTheDocument();
    expect(screen.getByText(mockSecurityData.inviteUrl)).toBeInTheDocument();
  });

  it("toggles invite links", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: mockSecurityData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: { ...mockSecurityData, inviteLinkEnabled: false } }),
      })
    );

    render(<SecurityPage />);
    await waitFor(() => screen.getByText("Security"));

    const toggle = screen.getByLabelText("Enable invite links");
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/security", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"inviteLinkEnabled":false'),
      }));
    });

    expect(screen.getByText("Invite links disabled.")).toBeInTheDocument();
  });

  it("adds an approved domain", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: mockSecurityData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: { ...mockSecurityData, approvedEmailDomains: ["acme.com", "globex.com"] } }),
      })
    );

    render(<SecurityPage />);
    await waitFor(() => screen.getByText("Security"));

    fireEvent.click(screen.getByText("Add domain"));
    expect(screen.getByText("Add approved domain")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("example.com");
    fireEvent.change(input, { target: { value: "globex.com" } });
    
    // Using getAllByRole because there are two "Add domain" buttons
    const submitBtn = screen.getAllByRole("button", { name: "Add domain" }).find(el => el.tagName === "BUTTON" && (el as HTMLButtonElement).type === "submit");
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/security", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"approvedEmailDomains":["acme.com","globex.com"]'),
      }));
    });

    expect(screen.getByText("Approved domain added.")).toBeInTheDocument();
  });

  it("removes an approved domain", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: mockSecurityData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: { ...mockSecurityData, approvedEmailDomains: [] } }),
      })
    );

    render(<SecurityPage />);
    await waitFor(() => screen.getByText("acme.com"));

    fireEvent.click(screen.getByLabelText("Remove acme.com"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/security", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"approvedEmailDomains":[]'),
      }));
    });

    expect(screen.getByText("Approved domain removed.")).toBeInTheDocument();
  });

  it("updates workspace management permissions", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: mockSecurityData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: { ...mockSecurityData, permissions: { ...mockSecurityData.permissions, invitationsRole: "members" } } }),
      })
    );

    render(<SecurityPage />);
    await waitFor(() => screen.getByText("Security"));

    const select = screen.getByLabelText("New user invitations");
    fireEvent.change(select, { target: { value: "members" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/security", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"invitationsRole":"members"'),
      }));
    });

    expect(screen.getByText("New user invitations updated.")).toBeInTheDocument();
  });
});
