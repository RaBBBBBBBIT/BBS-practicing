import { ThreadStatus, type ThreadDetail } from "@bbs/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ThreadDetailPage from "./page";
import { fetchThread } from "../../../lib/forum-api";

vi.mock("../../../lib/forum-api", () => ({
  fetchThread: vi.fn()
}));

const thread: ThreadDetail = {
  id: "thread_1",
  boardId: "board_1",
  boardSlug: "backend",
  boardName: "后端开发",
  authorId: "user_1",
  authorUsername: "alice",
  title: "API 错误处理实践",
  body: "这里是完整的主题正文，讨论异常过滤器、错误码和用户提示。",
  status: ThreadStatus.Published,
  tags: ["api", "nestjs"],
  createdAt: "2026-06-03T08:15:00.000Z",
  updatedAt: "2026-06-03T08:15:00.000Z"
};

describe("ThreadDetailPage", () => {
  beforeEach(() => {
    vi.mocked(fetchThread).mockResolvedValue(thread);
  });

  it("renders title, metadata, tags, board link, and full body", async () => {
    const html = renderToStaticMarkup(await ThreadDetailPage({ params: Promise.resolve({ id: "thread_1" }) }));

    expect(fetchThread).toHaveBeenCalledWith("thread_1");
    expect(html).toContain("API 错误处理实践");
    expect(html).toContain("alice");
    expect(html).toContain("后端开发");
    expect(html).toContain("/boards/backend");
    expect(html).toContain("api");
    expect(html).toContain("这里是完整的主题正文");
  });

  it("renders a stable unavailable state when the API cannot be reached", async () => {
    vi.mocked(fetchThread).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const html = renderToStaticMarkup(await ThreadDetailPage({ params: Promise.resolve({ id: "thread_1" }) }));

    expect(html).toContain("主题暂时不可用");
  });
});
