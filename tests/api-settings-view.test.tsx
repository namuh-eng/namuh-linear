import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import ApiSettingsPage from "@/app/(app)/settings/api/page";

const mockApiData = {
  permissionLevel: "admins",
  canManageWorkspaceApi: true,
  canCreateApiKeys: true,
  docs: {
    graphql: "https://linear.app/docs/api",
    oauthApplications: "https://linear.app/docs/oauth",
    webhooks: "https://linear.app/docs/webhooks",
  },
  oauthApplications: [
    {
      id: "oa-1",
      name: "Partner App",
      clientId: "client-123",
      redirectUrl: "https://example.com/callback",
      createdAt: "2024-01-01T00:00:00Z",
    },
  ],
  webhooks: [
    {
      id: "wh-1",
      label: "Sync Hook",
      url: "https://example.com/webhook",
      events: ["created", "updated"],
      enabled: true,
      createdAt: "2024-02-01T00:00:00Z",
    },
  ],
  apiKeys: [
    {
      id: "ak-1",
      name: "Local Script",
      keyPrefix: "lin_api_",
      accessLevel: "member",
      createdAt: "2024-03-01T00:00:00Z",
      lastUsedAt: "2024-04-26T10:00:00Z",
      creator: {
        id: "u-1",
        name: "Ashley",
        email: "ashley@example.com",
        image: null,
      },
    },
  ],
};

describe("ApiSettingsPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then API settings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ api: mockApiData }),
    }));

    render(<ApiSettingsPage />);
    expect(screen.getByText("Loading API settings...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading API settings...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Partner App")).toBeInTheDocument();
    expect(screen.getByText("Sync Hook")).toBeInTheDocument();
    expect(screen.getByText("Local Script")).toBeInTheDocument();
    
    const select = screen.getByLabelText("API key creation permission");
    expect(select).toHaveValue("admins");
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
    await waitFor(() => screen.getByText("Partner App"));

    const select = screen.getByLabelText("API key creation permission");
    fireEvent.change(select, { target: { value: "members" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/api", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ permissionLevel: "members" }),
      }));
    });

    expect(screen.getByText("API key creation permission updated.")).toBeInTheDocument();
  });

  it("opens OAuth application modal and submits", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: mockApiData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: mockApiData, createdCredential: { label: "New App", secret: "secret-456" } }),
      })
    );

    render(<ApiSettingsPage />);
    await waitFor(() => screen.getByText("Partner App"));

    fireEvent.click(screen.getByText("New OAuth application"));
    expect(screen.getByText("Create an OAuth application with a redirect callback URL.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Application name"), { target: { value: "New App" } });
    fireEvent.change(screen.getByLabelText("Redirect URL"), { target: { value: "https://app.com/cb" } });
    
    // Use getAllByRole because both header and button have this text
    const submitBtn = screen.getAllByRole("button", { name: "Create OAuth application" }).find(el => el.tagName === "BUTTON");
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/api", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"name":"New App"'),
      }));
    });

    expect(screen.getByText("OAuth application created.")).toBeInTheDocument();
    expect(screen.getByText("secret-456")).toBeInTheDocument();
  });

  it("opens Webhook modal and submits", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: mockApiData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: mockApiData }),
      })
    );

    render(<ApiSettingsPage />);
    await waitFor(() => screen.getByText("Sync Hook"));

    fireEvent.click(screen.getByText("New webhook"));
    expect(screen.getByText("Configure an HTTPS endpoint that receives create, update, and delete events.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Webhook name"), { target: { value: "New Hook" } });
    fireEvent.change(screen.getByLabelText("Endpoint URL"), { target: { value: "https://hooks.com" } });
    
    const submitBtn = screen.getByRole("button", { name: "Create webhook" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/api", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"action":"createWebhook"'),
      }));
    });
  });

  it("opens API key modal and submits", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: mockApiData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ api: mockApiData }),
      })
    );

    render(<ApiSettingsPage />);
    await waitFor(() => screen.getByText("Local Script"));

    fireEvent.click(screen.getByText("Create API key"));
    expect(screen.getByText("Create a member API key for scripts and local automation.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Key name"), { target: { value: "CI Bot" } });
    
    // Modal submit button
    const submitBtn = screen.getAllByRole("button", { name: "Create API key" }).find(el => el.tagName === "BUTTON" && el.type === "submit");
    // Wait, the button is not type submit in the code, but it's an ActionButton
    const buttons = screen.getAllByRole("button", { name: "Create API key" });
    // The first one is the list trigger, the last one is the modal button
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/current/api", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"action":"createApiKey"'),
      }));
    });
  });
});
