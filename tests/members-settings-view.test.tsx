import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockMembers = [
  {
    id: "m-1",
    kind: "member",
    userId: "u-1",
    name: "Alice Owner",
    email: "alice@example.com",
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
];

const mockResponse = {
  workspaceId: "ws-123",
  currentUserId: "u-1",
  viewerRole: "owner",
  members: mockMembers,
};

describe("MembersPage component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading state then member list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    }));

    render(<MembersPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Alice Owner")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });

  it("updates member role", async () => {
    const fetchMock = vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockResponse, members: [{ ...mockMembers[1], role: "admin" }] }),
      })
    );

    render(<MembersPage />);
    await waitFor(() => screen.getByText("Bob Member"));

    const roleSelect = screen.getByLabelText("Role for bob@example.com");
    fireEvent.change(roleSelect, { target: { value: "admin" } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/members", expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"role":"admin"'),
      }));
    });

    expect(screen.getByText("Member role updated.")).toBeInTheDocument();
  });

  it("opens invite dialog and submits invitations", async () => {
    const fetchMock = vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [{ email: "new@example.com", status: "sent" }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
    );

    render(<MembersPage />);
    await waitFor(() => screen.getByText("Alice Owner"));

    fireEvent.click(screen.getByText("Invite"));
    expect(screen.getByText("Invite members")).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText("teammate@company.com");
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });

    fireEvent.click(screen.getByText("Send invitations"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/invite", expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"email":"new@example.com"'),
      }));
    });

    expect(screen.getByText("Sent 1 invitation.")).toBeInTheDocument();
  });
});

import MembersPage from "@/app/(app)/settings/members/page";
