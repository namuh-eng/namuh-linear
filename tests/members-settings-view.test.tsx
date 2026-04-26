import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import MembersPage from "@/app/(app)/settings/members/page";

const mockMembersData = {
  workspaceId: "ws-123",
  currentUserId: "u-1",
  viewerRole: "owner",
  members: [
    {
      id: "m-1",
      kind: "member",
      userId: "u-1",
      name: "Ashley Owner",
      email: "ashley@example.com",
      image: null,
      role: "owner",
      status: "active",
      teams: ["Engineering"],
      joinedAt: "2024-01-01T00:00:00Z",
      lastSeenAt: "2024-04-26T10:00:00Z",
    },
    {
      id: "m-2",
      kind: "member",
      userId: "u-2",
      name: "Bob Member",
      email: "bob@example.com",
      image: null,
      role: "member",
      status: "active",
      teams: ["Design"],
      joinedAt: "2024-02-01T00:00:00Z",
      lastSeenAt: null,
    },
    {
      id: "m-3",
      kind: "invitation",
      userId: null,
      name: "",
      email: "pending@example.com",
      image: null,
      role: "member",
      status: "pending",
      teams: [],
      joinedAt: "2024-04-01T00:00:00Z",
      lastSeenAt: null,
    },
  ],
};

describe("MembersPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then member list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMembersData,
    }));

    render(<MembersPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Ashley Owner")).toBeInTheDocument();
    expect(screen.getByText("Bob Member")).toBeInTheDocument();
    expect(screen.getByText("pending@example.com")).toBeInTheDocument();
  });

  it("updates member role", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMembersData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMembersData, members: mockMembersData.members.map(m => m.id === "m-2" ? { ...m, role: "admin" } : m) }),
      })
    );

    render(<MembersPage />);
    await waitFor(() => screen.getByText("Bob Member"));

    const select = screen.getByLabelText("Role for bob@example.com");
    fireEvent.change(select, { target: { value: "admin" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/members", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"role":"admin"'),
      }));
    });

    expect(screen.getByText("Member role updated.")).toBeInTheDocument();
  });

  it("opens invite dialog and sends invitations", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMembersData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ email: "new@example.com", status: "sent" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMembersData,
      })
    );

    render(<MembersPage />);
    await waitFor(() => screen.getByText("Ashley Owner"));

    fireEvent.click(screen.getByText("Invite"));
    expect(screen.getByText("Invite members")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("teammate@company.com");
    fireEvent.change(input, { target: { value: "new@example.com" } });
    
    const submitBtn = screen.getByRole("button", { name: "Send invitations" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/invite", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"email":"new@example.com"'),
      }));
    });

    expect(screen.getByText("Sent 1 invitation.")).toBeInTheDocument();
  });

  it("exports CSV on button click", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMembersData,
    }));

    const createObjectURLMock = vi.fn().mockReturnValue("blob:url");
    vi.stubGlobal("URL", {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: vi.fn(),
    });

    render(<MembersPage />);
    await waitFor(() => screen.getByText("Export CSV"));

    fireEvent.click(screen.getByText("Export CSV"));

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(screen.getByText("Exported members CSV.")).toBeInTheDocument();
  });
});
