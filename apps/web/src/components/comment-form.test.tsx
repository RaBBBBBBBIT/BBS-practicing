import type { CommentSummary } from "@bbs/shared";
import { describe, expect, it, vi } from "vitest";
import { submitCommentForm } from "./comment-form";

const comment: CommentSummary = {
  id: "comment_1",
  threadId: "thread_1",
  authorId: "user_1",
  authorUsername: "alice",
  parentId: null,
  body: "真实评论",
  createdAt: "2026-06-04T00:00:00.000Z",
  updatedAt: "2026-06-04T00:00:00.000Z"
};

describe("submitCommentForm", () => {
  it("creates a comment and refreshes the current thread", async () => {
    const create = vi.fn().mockResolvedValue(comment);
    const refresh = vi.fn();

    await expect(
      submitCommentForm({
        threadId: "thread_1",
        body: "真实评论",
        create,
        refresh
      })
    ).resolves.toEqual({
      status: "created",
      comment
    });

    expect(create).toHaveBeenCalledWith("thread_1", { body: "真实评论" });
    expect(refresh).toHaveBeenCalled();
  });

  it("returns an unauthenticated result when the API rejects with 401", async () => {
    const create = vi.fn().mockRejectedValue(new Error("API request failed with status 401"));
    const refresh = vi.fn();

    await expect(
      submitCommentForm({
        threadId: "thread_1",
        body: "未登录评论",
        create,
        refresh
      })
    ).resolves.toEqual({
      status: "unauthenticated",
      message: "请先登录后再发表评论。"
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
