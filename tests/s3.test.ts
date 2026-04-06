import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock AWS SDK modules
vi.mock("@aws-sdk/client-s3", () => {
  const sendMock = vi.fn(() => Promise.resolve({}));
  return {
    S3Client: vi.fn().mockImplementation(() => ({ send: sendMock })),
    PutObjectCommand: vi
      .fn()
      .mockImplementation((input) => ({ ...input, _type: "PutObject" })),
    GetObjectCommand: vi
      .fn()
      .mockImplementation((input) => ({ ...input, _type: "GetObject" })),
    DeleteObjectCommand: vi.fn().mockImplementation((input) => ({
      ...input,
      _type: "DeleteObject",
    })),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(() =>
    Promise.resolve("https://s3.example.com/signed-url"),
  ),
}));

vi.stubEnv("S3_BUCKET", "test-bucket");
vi.stubEnv("AWS_REGION", "us-east-1");

describe("S3 storage utilities", () => {
  let s3Module: typeof import("@/lib/s3");

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("S3_BUCKET", "test-bucket");
    vi.stubEnv("AWS_REGION", "us-east-1");
    s3Module = await import("@/lib/s3");
  });

  it("exports s3 client", () => {
    expect(s3Module.s3).toBeDefined();
  });

  it("getUploadUrl returns a presigned URL", async () => {
    const url = await s3Module.getUploadUrl("avatars/test.png", "image/png");
    expect(url).toBe("https://s3.example.com/signed-url");
  });

  it("getDownloadUrl returns a presigned URL", async () => {
    const url = await s3Module.getDownloadUrl("avatars/test.png");
    expect(url).toBe("https://s3.example.com/signed-url");
  });

  it("uploadFile sends a PutObjectCommand", async () => {
    await s3Module.uploadFile("test.txt", Buffer.from("hello"), "text/plain");
    expect(s3Module.s3.send).toHaveBeenCalled();
  });

  it("deleteFile sends a DeleteObjectCommand", async () => {
    await s3Module.deleteFile("test.txt");
    expect(s3Module.s3.send).toHaveBeenCalled();
  });

  it("buildKey creates correct paths for avatars", () => {
    const key = s3Module.buildKey("avatar", "ws-123", "photo.png");
    expect(key).toMatch(/^avatars\/ws-123\/\d+-photo\.png$/);
  });

  it("buildKey creates correct paths for attachments", () => {
    const key = s3Module.buildKey("attachment", "ws-456", "doc.pdf");
    expect(key).toMatch(/^attachments\/ws-456\/\d+-doc\.pdf$/);
  });

  it("buildKey creates correct paths for assets", () => {
    const key = s3Module.buildKey("asset", "ws-789", "logo.svg");
    expect(key).toMatch(/^assets\/ws-789\/\d+-logo\.svg$/);
  });

  it("throws when S3_BUCKET is not set", async () => {
    vi.resetModules();
    vi.stubEnv("S3_BUCKET", "");
    const mod = await import("@/lib/s3");
    await expect(mod.getUploadUrl("key", "text/plain")).rejects.toThrow(
      "S3_BUCKET environment variable is not set",
    );
  });
});
