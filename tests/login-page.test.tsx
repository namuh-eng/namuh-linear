import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-client", () => ({
  signIn: {
    social: vi.fn(),
    magicLink: vi.fn(() => Promise.resolve()),
  },
  signOut: vi.fn(),
  useSession: vi.fn(() => ({ data: null, isPending: false })),
  authClient: {},
}));

const assignMock = vi.fn();
const mockLocation = {
  ...window.location,
  assign: assignMock,
  search: "",
};

vi.stubGlobal("location", mockLocation);

import LoginPage from "@/app/(auth)/login/page";
import SignupPage from "@/app/(auth)/signup/page";
import { signIn } from "@/lib/auth-client";

describe("Login page", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    assignMock.mockReset();
    mockLocation.search = "";
  });

  it("renders the login title", () => {
    render(<LoginPage />);
    expect(screen.getByText("Log in to Linear")).toBeDefined();
  });

  it("shows Continue with Google button", () => {
    render(<LoginPage />);
    expect(screen.getByText("Continue with Google")).toBeDefined();
  });

  it("shows Continue with Email button", () => {
    render(<LoginPage />);
    expect(screen.getByText("Continue with Email")).toBeDefined();
  });

  it("calls signIn.social with google provider on Google click", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/",
    });
  });

  it("uses the callbackUrl query param for Google sign-in", () => {
    mockLocation.search = "?callbackUrl=%2Fteam%2FABC%2Fboard";
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Google"));
    expect(signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/team/ABC/board",
    });
  });

  it("shows email input after clicking Continue with Email", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));
    expect(
      screen.getByPlaceholderText("Enter your email address..."),
    ).toBeDefined();
  });

  it("shows back button in email step", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));
    expect(screen.getByText("Back to login options")).toBeDefined();
  });

  it("returns to choose step when clicking back", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));
    fireEvent.click(screen.getByText("Back to login options"));
    expect(screen.getByText("Continue with Google")).toBeDefined();
  });

  it("shows email-sent step after submitting email", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));

    const input = screen.getByPlaceholderText("Enter your email address...");
    fireEvent.change(input, { target: { value: "test@example.com" } });

    const form = input.closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await vi.waitFor(() => {
      expect(screen.getByText("Check your email")).toBeDefined();
    });
    expect(screen.getByPlaceholderText("Enter 6-digit code")).toBeDefined();

    expect(signIn.magicLink).toHaveBeenCalledWith({
      email: "test@example.com",
      callbackURL: "/",
      errorCallbackURL: "/login",
    });
  });

  it("preserves callbackUrl when requesting a magic link", async () => {
    mockLocation.search = "?callbackUrl=%2Fteam%2FABC%2Fboard";
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));

    const input = screen.getByPlaceholderText("Enter your email address...");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await vi.waitFor(() => {
      expect(signIn.magicLink).toHaveBeenCalledWith({
        email: "test@example.com",
        callbackURL: "/team/ABC/board",
        errorCallbackURL: "/login?callbackUrl=%2Fteam%2FABC%2Fboard",
      });
    });
  });

  it("shows footer with terms text", () => {
    render(<LoginPage />);
    expect(screen.getByText("Terms of Service")).toBeDefined();
    expect(screen.getByText("Privacy Policy")).toBeDefined();
  });

  it("shows signup affordance on the login page", () => {
    render(<LoginPage />);
    expect(screen.getByText("Sign up")).toBeDefined();
    expect(screen.getByText("learn more")).toBeDefined();
  });

  it("shows error when magic link fails", async () => {
    vi.mocked(signIn.magicLink).mockRejectedValueOnce(new Error("fail"));
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));

    const input = screen.getByPlaceholderText("Enter your email address...");
    fireEvent.change(input, { target: { value: "bad@example.com" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await vi.waitFor(() => {
      expect(
        screen.getByText("Failed to send magic link. Please try again."),
      ).toBeDefined();
    });
  });

  it("allows returning from email-sent to choose step", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));

    const input = screen.getByPlaceholderText("Enter your email address...");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await vi.waitFor(() => {
      expect(screen.getByText("Check your email")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Use a different method"));
    expect(screen.getByText("Continue with Google")).toBeDefined();
  });

  it("displays the submitted email in confirmation", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));

    const input = screen.getByPlaceholderText("Enter your email address...");
    fireEvent.change(input, { target: { value: "hello@linear.app" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await vi.waitFor(() => {
      expect(screen.getByText("hello@linear.app")).toBeDefined();
    });
  });

  it("navigates to magic-link verification when a valid code is submitted", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));

    const emailInput = screen.getByPlaceholderText(
      "Enter your email address...",
    );
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.submit(emailInput.closest("form") as HTMLFormElement);

    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText("Enter 6-digit code")).toBeDefined();
    });

    const codeInput = screen.getByPlaceholderText("Enter 6-digit code");
    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.submit(codeInput.closest("form") as HTMLFormElement);

    expect(assignMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/magic-link/verify?token=123456&callbackURL=%2F&errorCallbackURL=%2Flogin",
    );
  });

  it("preserves callbackUrl when verifying a valid code", async () => {
    mockLocation.search = "?callbackUrl=%2Fteam%2FABC%2Fboard";
    render(<LoginPage />);
    fireEvent.click(screen.getByText("Continue with Email"));

    const emailInput = screen.getByPlaceholderText(
      "Enter your email address...",
    );
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.submit(emailInput.closest("form") as HTMLFormElement);

    await vi.waitFor(() => {
      expect(screen.getByPlaceholderText("Enter 6-digit code")).toBeDefined();
    });

    const codeInput = screen.getByPlaceholderText("Enter 6-digit code");
    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.submit(codeInput.closest("form") as HTMLFormElement);

    expect(assignMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/magic-link/verify?token=123456&callbackURL=%2Fteam%2FABC%2Fboard&errorCallbackURL=%2Flogin%3FcallbackUrl%3D%252Fteam%252FABC%252Fboard",
    );
  });

  it("renders the signup variant", () => {
    render(<SignupPage />);
    expect(screen.getByText("Create your workspace")).toBeDefined();
    expect(screen.getByText("Already have an account?")).toBeDefined();
    expect(screen.getByText("Log in")).toBeDefined();
    expect(screen.getByText("Terms of Service")).toBeDefined();
    expect(screen.getByText("Data Processing Agreement")).toBeDefined();
  });
});
