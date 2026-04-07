import {
  buildNotificationValues,
  extractMentionTokens,
  resolveMentionedUserIdsFromCandidates,
} from "@/lib/notifications";
import { describe, expect, it } from "vitest";

describe("notifications helpers", () => {
  it("extracts unique mention tokens from comment text", () => {
    expect(
      extractMentionTokens("Please review this, @Jaeyun and @jaeyun."),
    ).toEqual(["jaeyun"]);
  });

  it("resolves mentioned users from workspace member candidates", () => {
    const mentionedUserIds = resolveMentionedUserIdsFromCandidates(
      "Looping in @jaeyun and @ashley",
      [
        {
          userId: "user-1",
          email: "jaeyunha0317@gmail.com",
          name: "Jaeyun Ha",
        },
        {
          userId: "user-2",
          email: "ashley@example.com",
          name: "Ashley Ha",
        },
      ],
    );

    expect(mentionedUserIds).toEqual(["user-1", "user-2"]);
  });

  it("deduplicates recipient ids when building notification rows", () => {
    expect(
      buildNotificationValues({
        type: "comment",
        actorId: "actor-1",
        issueId: "issue-1",
        userIds: ["user-1", "user-1", null, "user-2"],
      }),
    ).toEqual([
      {
        type: "comment",
        actorId: "actor-1",
        issueId: "issue-1",
        userId: "user-1",
      },
      {
        type: "comment",
        actorId: "actor-1",
        issueId: "issue-1",
        userId: "user-2",
      },
    ]);
  });
});
