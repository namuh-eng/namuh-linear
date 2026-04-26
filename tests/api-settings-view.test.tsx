import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockApiData = {
  docs: {
    graphql: "https://linear.app/docs/graphql",
    oauthApplications: "https://linear.app/docs/oauth",
    webhooks: "https://linear.app/docs/webhooks",
  },
  oauthApplications: [
    {
      id: "oa-1",
      name: "Test App",
      clientId: "client-123",
      redirectUrl: "http://localhost/callback",
      createdAt: "2024-01-01T00:00:00Z",
    },
  ],
  webhooks: [],
  apiKeys: [],
  canManageWorkspaceApi: true,
  canCreateApiKeys: true,
  permissionLevel: "admins",
};

describe("ApiSettingsPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then API details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ api: mockApiData }),
    }));

    render(<ApiSettingsPage />);
    expect(screen.getByText("Loading API settings...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading API settings...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("OAuth Applications")).toBeInTheDocument();
    expect(screen.getByText("Test App")).toBeInTheDocument();
    expect(screen.getByText("No webhooks")).toBeInTheDocument();
  });

  it("updates API key creation permission", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: mockApiData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: { ...mockApiData, permissionLevel: "members" } }),
      })
    );

    render(<ApiSettingsPage />);
    await waitFor(() => screen.getByLabelText("API key creation permission"));

    const select = screen.getByLabelText("API key creation permission");
    fireEvent.change(select, { target: { value: "members" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/api", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"permissionLevel":"members"'),
      }));
    });

    expect(screen.getByText("API key creation permission updated.")).toBeInTheDocument();
  });

  it("opens OAuth modal and submits new application", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: mockApiData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          api: mockApiData, 
          createdCredential: { label: "Partner portal", secret: "secret-123" } 
        }),
      })
    );

    render(<ApiSettingsPage />);
    await waitFor(() => screen.getByText("New OAuth application"));

    fireEvent.click(screen.getByText("New OAuth application"));
    expect(screen.getByText("Create an OAuth application with a redirect callback URL.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Application name"), { target: { value: "Partner portal" } });
    fireEvent.click(screen.getByRole("button", { name: "Create OAuth application" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/api", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"name":"Partner portal"'),
      }));
    });

    expect(screen.getByText("secret-123")).toBeInTheDocument();
  });
});

import ApiSettingsPage from "@/app/(app)/settings/api/page";
