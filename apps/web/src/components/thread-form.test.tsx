import { ThreadStatus, type ThreadSummary } from "@bbs/shared";
import { describe, expect, it, vi } from "vitest";
import { submitThreadForm } from "./thread-form";

const thread: ThreadSummary = {
  id: "thread_1",
  boardId: "board_1",
  boardSlug: "backend",
  boardName: "后端开发",
  authorId: "user_1",
  authorUsername: "alice",
  title: "API 错误处理实践",
  excerpt: "讨论异常过滤器和错误码。",
  status: ThreadStatus.Published,
  tags: ["api"],
  createdAt: "2026-06-03T08:15:00.000Z",
  updatedAt: "2026-06-03T08:15:00.000Z"
};

describe("submitThreadForm", () => {
  it("creates a thread with parsed tags and redirects to its detail page", async () => {
    const create = vi.fn().mockResolvedValue(thread);
    const redirect = vi.fn();

    await submitThreadForm({
      values: {
        boardId: "board_1",
        title: "API 错误处理实践",
        body: "讨论异常过滤器、错误码和用户提示。",
        tagsText: "nestjs, architecture  api"
      },
      create,
      redirect
    });

    expect(create).toHaveBeenCalledWith({
      boardId: "board_1",
      title: "API 错误处理实践",
      body: "讨论异常过滤器、错误码和用户提示。",
      tags: ["nestjs", "architecture", "api"]
    });
    expect(redirect).toHaveBeenCalledWith("/threads/thread_1");
  });

  it("returns an unauthenticated result when the API rejects with 401", async () => {
    const create = vi.fn().mockRejectedValue(new Error("API request failed with status 401"));
    const redirect = vi.fn();

    await expect(
      submitThreadForm({
        values: {
          boardId: "board_1",
          title: "API 错误处理实践",
          body: "讨论异常过滤器、错误码和用户提示。",
          tagsText: ""
        },
        create,
        redirect
      })
    ).resolves.toEqual({
      status: "unauthenticated",
      message: "请先登录后再发布主题。"
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
