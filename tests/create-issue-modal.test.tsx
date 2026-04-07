import { CreateIssueModal } from "@/components/create-issue-modal";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
});

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  teamKey: "ENG",
  teamName: "Engineering",
  teamId: "team-1",
  defaultStateId: "state-1",
};

describe("CreateIssueModal", () => {
  it("renders modal when open", () => {
    render(<CreateIssueModal {...defaultProps} />);
    expect(screen.getByText("New issue")).toBeDefined();
  });

  it("does not render when closed", () => {
    render(<CreateIssueModal {...defaultProps} open={false} />);
    expect(screen.queryByText("New issue")).toBeNull();
  });

  it("renders team identifier", () => {
    render(<CreateIssueModal {...defaultProps} />);
    expect(screen.getByText("ENG")).toBeDefined();
  });

  it("renders title input", () => {
    render(<CreateIssueModal {...defaultProps} />);
    const input = screen.getByPlaceholderText("Issue title");
    expect(input).toBeDefined();
  });

  it("renders description input", () => {
    render(<CreateIssueModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText("Add description...");
    expect(textarea).toBeDefined();
  });

  it("renders Create Issue button", () => {
    render(<CreateIssueModal {...defaultProps} />);
    expect(screen.getByText("Create Issue")).toBeDefined();
  });

  it("renders toolbar buttons (Status, Priority, Labels)", () => {
    render(<CreateIssueModal {...defaultProps} />);
    expect(screen.getByText("Backlog")).toBeDefined();
    expect(screen.getByText("Priority")).toBeDefined();
    expect(screen.getByText("Labels")).toBeDefined();
  });

  it("renders close button", () => {
    render(<CreateIssueModal {...defaultProps} />);
    const closeBtn = screen.getByRole("button", { name: /close/i });
    expect(closeBtn).toBeDefined();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(<CreateIssueModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("disables submit when title is empty", () => {
    render(<CreateIssueModal {...defaultProps} />);
    const btn = screen.getByText("Create Issue");
    expect(btn.closest("button")?.disabled).toBe(true);
  });

  it("enables submit when title is entered", () => {
    render(<CreateIssueModal {...defaultProps} />);
    const input = screen.getByPlaceholderText("Issue title");
    fireEvent.change(input, { target: { value: "Fix bug" } });
    const btn = screen.getByText("Create Issue");
    expect(btn.closest("button")?.disabled).toBe(false);
  });

  it("renders Create more toggle", () => {
    render(<CreateIssueModal {...defaultProps} />);
    expect(screen.getByText("Create more")).toBeDefined();
  });
});
