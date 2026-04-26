import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockSecurity = {
  inviteLinkEnabled: true,
  inviteUrl: "https://linear.app/i/acme",
  approvedEmailDomains: ["acme.com"],
  authentication: {
    google: true,
    emailPasskey: true,
  },
  permissions: {
    invitationsRole: "admins",
    teamCreationRole: "members",
    labelManagementRole: "anyone",
    templateManagementRole: "admins",
    apiKeyCreationRole: "members",
    agentGuidanceRole: "admins",
  },
  restrictFileUploads: false,
  improveAi: true,
  webSearch: true,
  hipaa: false,
};

describe("SecurityPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then security details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ security: mockSecurity }),
    }));

    render(<SecurityPage />);
    expect(screen.getByText("Loading security settings...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading security settings...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Workspace access")).toBeInTheDocument();
    expect(screen.getByText("acme.com")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(6);
  });

  it("toggles invite links", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: mockSecurity }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: { ...mockSecurity, inviteLinkEnabled: false } }),
      })
    );

    render(<SecurityPage />);
    await waitFor(() => screen.getByText("Enable invite links"));

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

  it("adds an approved email domain", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: mockSecurity }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ security: { ...mockSecurity, approvedEmailDomains: ["acme.com", "example.com"] } }),
      })
    );

    render(<SecurityPage />);
    await waitFor(() => screen.getByText("Add domain"));

    fireEvent.click(screen.getAllByRole("button", { name: "Add domain" }).find(btn => btn.tagName === "BUTTON" && !btn.classList.contains("rounded-md")));
    
    const input = screen.getByPlaceholderText("example.com");
    fireEvent.change(input, { target: { value: "example.com" } });
    
    fireEvent.click(screen.getAllByRole("button", { name: "Add domain" }).find(btn => btn.getAttribute("type") === "submit"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/security", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"approvedEmailDomains":["acme.com","example.com"]'),
      }));
    });

    expect(screen.getByText("Approved domain added.")).toBeInTheDocument();
  });
});

import SecurityPage from "@/app/(app)/settings/security/page";
