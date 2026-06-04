import { BoardStatus, ThreadStatus, type BoardSummary, type ThreadSummary } from "@bbs/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "./page";
import { fetchBoards, fetchThreads } from "../lib/forum-api";

vi.mock("../lib/forum-api", () => ({
  fetchBoards: vi.fn(),
  fetchThreads: vi.fn()
}));

const boards: BoardSummary[] = [
  {
    id: "board_1",
    slug: "backend",
    name: "后端开发",
    description: "讨论 NestJS、数据库和服务端工程。",
    status: BoardStatus.Open,
    threadCount: 2
  }
];

const threads: ThreadSummary[] = [
  {
    id: "thread_1",
    boardId: "board_1",
    boardSlug: "backend",
    boardName: "后端开发",
    authorId: "user_1",
    authorUsername: "alice",
    title: "如何设计 NestJS 模块边界",
    excerpt: "想讨论一下模块拆分和 provider 组织方式。",
    status: ThreadStatus.Published,
    tags: ["nestjs", "architecture"],
    createdAt: "2026-06-03T08:15:00.000Z",
    updatedAt: "2026-06-03T08:15:00.000Z"
  }
];

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(fetchBoards).mockResolvedValue(boards);
    vi.mocked(fetchThreads).mockResolvedValue(threads);
  });

  it("renders the GitHub-style discussion workbench", async () => {
    const html = renderToStaticMarkup(await HomePage());

    expect(fetchBoards).toHaveBeenCalledOnce();
    expect(fetchThreads).toHaveBeenCalledWith();
    expect(html).toContain("开发者讨论工作台");
    expect(html).toContain("搜索或跳转...");
    expect(html).toContain("讨论");
    expect(html).toContain("分区");
    expect(html).toContain("发起讨论");
    expect(html).toContain("排序：最近活跃");
    expect(html).toContain("is:open");
    expect(html).toContain("查看全部讨论");
    expect(html).toContain("后端开发");
    expect(html).toContain("/boards/backend");
    expect(html).toContain("如何设计 NestJS 模块边界");
    expect(html).toContain("/threads/thread_1");
    expect(html).toContain("#1 由 alice");
    expect(html).toContain("发起");
    expect(html).toContain("/login");
    expect(html).toContain("/register");
    expect(html).toContain("/threads/new");
  });

  it("renders a stable unavailable state when the API cannot be reached", async () => {
    vi.mocked(fetchBoards).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("论坛数据暂时不可用");
  });
});
