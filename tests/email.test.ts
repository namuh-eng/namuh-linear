import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn<(cmd: unknown) => Promise<unknown>>(() =>
  Promise.resolve({ MessageId: "test-msg-id" }),
);

vi.mock("@aws-sdk/client-sesv2", () => ({
  SESv2Client: vi.fn().mockImplementation(() => ({ send: sendMock })),
  SendEmailCommand: vi.fn().mockImplementation((input) => input),
}));

vi.stubEnv("AWS_REGION", "us-east-1");
vi.stubEnv("SENDER_EMAIL", "test@example.com");

function getLastSentCommand(): Record<string, unknown> {
  return sendMock.mock.lastCall?.[0] as Record<string, unknown>;
}

describe("Email utilities", () => {
  let emailModule: typeof import("@/lib/email");

  beforeEach(async () => {
    sendMock.mockClear();
    vi.resetModules();
    vi.stubEnv("AWS_REGION", "us-east-1");
    vi.stubEnv("SENDER_EMAIL", "test@example.com");
    emailModule = await import("@/lib/email");
  });

  it("exports ses client", () => {
    expect(emailModule.ses).toBeDefined();
  });

  it("sendEmail sends via SES with correct structure", async () => {
    await emailModule.sendEmail({
      to: "user@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(sendMock).toHaveBeenCalledOnce();
    expect(getLastSentCommand()).toMatchObject({
      FromEmailAddress: "test@example.com",
      Destination: { ToAddresses: ["user@example.com"] },
      Content: {
        Simple: {
          Subject: { Data: "Test Subject" },
          Body: {
            Html: { Data: "<p>Hello</p>" },
            Text: { Data: "Hello" },
          },
        },
      },
    });
  });

  it("sendEmail works without text body", async () => {
    await emailModule.sendEmail({
      to: "user@example.com",
      subject: "HTML Only",
      html: "<p>Hello</p>",
    });

    expect(sendMock).toHaveBeenCalledOnce();
    const cmd = getLastSentCommand() as {
      Content: { Simple: { Body: { Html: { Data: string }; Text?: unknown } } };
    };
    expect(cmd.Content.Simple.Body.Html).toEqual({ Data: "<p>Hello</p>" });
    expect(cmd.Content.Simple.Body.Text).toBeUndefined();
  });

  it("sendMagicLinkEmail includes code and link", async () => {
    await emailModule.sendMagicLinkEmail(
      "user@example.com",
      "123456",
      "https://app.example.com/verify?token=abc",
    );

    expect(sendMock).toHaveBeenCalledOnce();
    const cmd = getLastSentCommand() as {
      Content: {
        Simple: { Subject: { Data: string }; Body: { Html: { Data: string } } };
      };
    };
    expect(cmd.Content.Simple.Subject.Data).toContain("123456");
    expect(cmd.Content.Simple.Body.Html.Data).toContain("123456");
    expect(cmd.Content.Simple.Body.Html.Data).toContain(
      "https://app.example.com/verify?token=abc",
    );
  });

  it("sendInvitationEmail includes workspace name and inviter", async () => {
    await emailModule.sendInvitationEmail(
      "invitee@example.com",
      "Acme Corp",
      "John",
      "https://app.example.com/invite/xyz",
    );

    expect(sendMock).toHaveBeenCalledOnce();
    const cmd = getLastSentCommand() as {
      Content: {
        Simple: { Subject: { Data: string }; Body: { Html: { Data: string } } };
      };
    };
    expect(cmd.Content.Simple.Subject.Data).toContain("John");
    expect(cmd.Content.Simple.Subject.Data).toContain("Acme Corp");
    expect(cmd.Content.Simple.Body.Html.Data).toContain("Acme Corp");
    expect(cmd.Content.Simple.Body.Html.Data).toContain(
      "https://app.example.com/invite/xyz",
    );
  });

  it("sendNotificationEmail includes body and action link", async () => {
    await emailModule.sendNotificationEmail(
      "user@example.com",
      "Issue assigned",
      "You were assigned ENG-123",
      "https://app.example.com/issue/ENG-123",
    );

    expect(sendMock).toHaveBeenCalledOnce();
    const cmd = getLastSentCommand() as {
      Content: { Simple: { Body: { Html: { Data: string } } } };
    };
    expect(cmd.Content.Simple.Body.Html.Data).toContain(
      "https://app.example.com/issue/ENG-123",
    );
  });
});
