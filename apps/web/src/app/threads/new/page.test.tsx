import { BoardStatus, type BoardSummary } from "@bbs/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewThreadPage from "./page";
import { fetchBoards } from "../../../lib/forum-api";

vi.mock("../../../components/thread-form", () => ({
  ThreadForm: ({ boards }: { boards: BoardSummary[] }) => <form data-board-count={boards.length}>thread form</form>
}));

vi.mock("../../../lib/forum-api", () => ({
  fetchBoards: vi.fn()
}));

const boards: BoardSummary[] = [
  {
    id: "board_1",
    slug: "backend",
    name: "后端开发",
    description: "讨论服务端工程。",
    status: BoardStatus.Open,
    threadCount: 1
  }
];

describe("NewThreadPage", () => {
  beforeEach(() => {
    vi.mocked(fetchBoards).mockResolvedValue(boards);
  });

  it("loads boards and renders the posting form", async () => {
    const html = renderToStaticMarkup(await NewThreadPage());

    expect(fetchBoards).toHaveBeenCalledOnce();
    expect(html).toContain("发布主题");
    expect(html).toContain('data-board-count="1"');
  });

  it("renders a stable unavailable state when boards cannot load", async () => {
    vi.mocked(fetchBoards).mockRejectedValue(new Error("connect ECONNREFUSED"));

    const html = renderToStaticMarkup(await NewThreadPage());

    expect(html).toContain("论坛数据暂时不可用");
  });
});
