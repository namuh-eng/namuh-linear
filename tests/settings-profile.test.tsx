import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import ProfilePage from "@/app/(app)/settings/account/profile/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/settings/account/profile",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockSession() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      user: {
        name: "John Doe",
        email: "john@example.com",
        username: "johnd",
        image: null,
      },
    }),
  });
}

function waitForLoaded() {
  return waitFor(() => {
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
}

describe("Account Profile Page", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Profile heading", async () => {
    mockSession();
    render(<ProfilePage />);
    await waitForLoaded();
    expect(
      screen.getByRole("heading", { name: "Profile" }),
    ).toBeInTheDocument();
  });

  it("renders profile picture section with upload button", async () => {
    mockSession();
    render(<ProfilePage />);
    await waitForLoaded();
    expect(screen.getByText("Profile picture")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload photo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Recommended size: 256x256px")).toBeInTheDocument();
  });

  it("renders email as read-only", async () => {
    mockSession();
    render(<ProfilePage />);
    await waitForLoaded();
    expect(screen.getByText("Email")).toBeInTheDocument();
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    expect(emailInput.value).toBe("john@example.com");
    expect(emailInput).toHaveAttribute("readOnly");
  });

  it("renders editable Full name input", async () => {
    mockSession();
    render(<ProfilePage />);
    await waitForLoaded();
    const nameInput = screen.getByLabelText("Full name") as HTMLInputElement;
    expect(nameInput.value).toBe("John Doe");

    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput.value).toBe("Jane Doe");
  });

  it("renders editable Username input with placeholder", async () => {
    mockSession();
    render(<ProfilePage />);
    await waitForLoaded();
    const usernameInput = screen.getByLabelText("Username") as HTMLInputElement;
    expect(usernameInput.value).toBe("johnd");
    expect(usernameInput).toHaveAttribute(
      "placeholder",
      "One word, like a nickname or first name",
    );
  });

  it("renders Update button", async () => {
    mockSession();
    render(<ProfilePage />);
    await waitForLoaded();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });

  it("renders Leave workspace button in danger zone", async () => {
    mockSession();
    render(<ProfilePage />);
    await waitForLoaded();
    expect(screen.getByText("Workspace access")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Leave workspace" }),
    ).toBeInTheDocument();
  });

  it("calls update API when Update is clicked", async () => {
    mockSession();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(<ProfilePage />);
    await waitForLoaded();

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/update-user",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
