import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ key: "ENG" }),
}));

// ─── CommandPalette ─────────────────────────────────────────────────

describe("CommandPalette", () => {
  afterEach(cleanup);

  it("renders when open", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    render(<CommandPalette open={true} onClose={vi.fn()} teamKey="ENG" />);
    expect(
      screen.getByPlaceholderText("Type a command or search..."),
    ).toBeTruthy();
  });

  it("does not render when closed", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    const { container } = render(
      <CommandPalette open={false} onClose={vi.fn()} teamKey="ENG" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("shows grouped commands by default", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    render(<CommandPalette open={true} onClose={vi.fn()} teamKey="ENG" />);
    expect(screen.getByText("Issues")).toBeTruthy();
    expect(screen.getByText("Navigation")).toBeTruthy();
  });

  it("shows Create new issue command", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    render(<CommandPalette open={true} onClose={vi.fn()} teamKey="ENG" />);
    expect(screen.getByText("Create new issue")).toBeTruthy();
  });

  it("shows Projects commands", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    render(<CommandPalette open={true} onClose={vi.fn()} teamKey="ENG" />);
    expect(screen.getByText("Projects")).toBeTruthy();
  });

  it("filters commands based on search input", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    render(<CommandPalette open={true} onClose={vi.fn()} teamKey="ENG" />);
    const input = screen.getByPlaceholderText("Type a command or search...");
    fireEvent.change(input, { target: { value: "create" } });
    expect(screen.getByText("Create new issue")).toBeTruthy();
    // Navigation commands should be filtered out
    expect(screen.queryByText("Go to Inbox")).toBeNull();
  });

  it("calls onClose when backdrop clicked", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    const onClose = vi.fn();
    render(<CommandPalette open={true} onClose={onClose} teamKey="ENG" />);
    fireEvent.click(screen.getByTestId("command-palette-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape pressed", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    const onClose = vi.fn();
    render(<CommandPalette open={true} onClose={onClose} teamKey="ENG" />);
    const input = screen.getByPlaceholderText("Type a command or search...");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows keyboard shortcuts next to commands", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    render(<CommandPalette open={true} onClose={vi.fn()} teamKey="ENG" />);
    expect(screen.getByText("C")).toBeTruthy(); // Create issue shortcut
  });

  it("shows bottom bar with Enter hint", async () => {
    const { CommandPalette } = await import("@/components/command-palette");
    render(<CommandPalette open={true} onClose={vi.fn()} teamKey="ENG" />);
    expect(screen.getByText("Open")).toBeTruthy();
  });
});
