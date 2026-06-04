import { BoardStatus, ThreadStatus, type BoardSummary, type ThreadSummary } from "@bbs/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BoardPage from "./page";
import { fetchBoards, fetchThreads } from "../../../lib/forum-api";

vi.mock("../../../lib/forum-api", () => ({
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
    threadCount: 1
  },
  {
    id: "board_2",
    slug: "frontend",
    name: "前端开发",
    description: "讨论 React 和 CSS。",
    status: BoardStatus.Open,
    threadCount: 0
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
    title: "API 错误处理实践",
    excerpt: "想整理一下 NestJS API 的错误边界。",
    status: ThreadStatus.Published,
    tags: ["api"],
    commentCount: 1,
    reactionCount: 2,
    bookmarkCount: 0,
    viewCount: 64,
    isPinned: false,
    isLocked: false,
    viewerHasReacted: false,
    viewerHasBookmarked: false,
    createdAt: "2026-06-03T08:15:00.000Z",
    updatedAt: "2026-06-03T08:15:00.000Z"
  }
];

describe("BoardPage", () => {
  beforeEach(() => {
    vi.mocked(fetchBoards).mockResolvedValue(boards);
    vi.mocked(fetchThreads).mockResolvedValue(threads);
  });

  it("renders the selected board and board-specific threads", async () => {
    const html = renderToStaticMarkup(await BoardPage({ params: Promise.resolve({ slug: "backend" }) }));

    expect(fetchBoards).toHaveBeenCalledOnce();
    expect(fetchThreads).toHaveBeenCalledWith({ boardSlug: "backend", q: undefined, sort: "active" });
    expect(html).toContain("后端开发");
    expect(html).toContain("讨论 NestJS、数据库和服务端工程。");
    expect(html).toContain("API 错误处理实践");
    expect(html).toContain("/threads/thread_1");
    expect(html).toContain("/boards/frontend");
  });

  it("renders a missing board state for unknown slugs", async () => {
    const html = renderToStaticMarkup(await BoardPage({ params: Promise.resolve({ slug: "unknown" }) }));

    expect(html).toContain("分区不存在");
  });

  it("renders a stable unavailable state when the API cannot be reached", async () => {
    vi.mocked(fetchBoards).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const html = renderToStaticMarkup(await BoardPage({ params: Promise.resolve({ slug: "backend" }) }));

    expect(html).toContain("论坛数据暂时不可用");
  });
});
