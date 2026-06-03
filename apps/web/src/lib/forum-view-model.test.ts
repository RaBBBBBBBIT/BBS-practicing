import type { BoardSummary, ThreadSummary } from "@bbs/shared";
import { BoardStatus, ThreadStatus } from "@bbs/shared";
import { describe, expect, it } from "vitest";
import { formatThreadDate, getBoardHref, getBoardOptions, getThreadHref, splitTags } from "./forum-view-model";

const board: BoardSummary = {
  id: "board_1",
  slug: "backend",
  name: "后端开发",
  description: "讨论服务端工程。",
  status: BoardStatus.Open,
  threadCount: 2
};

const thread: ThreadSummary = {
  id: "thread_1",
  boardId: "board_1",
  boardSlug: "backend",
  boardName: "后端开发",
  authorId: "user_1",
  authorUsername: "alice",
  title: "NestJS providers",
  excerpt: "How do I debug providers?",
  status: ThreadStatus.Published,
  tags: ["nestjs"],
  createdAt: "2026-06-03T08:15:00.000Z",
  updatedAt: "2026-06-03T08:15:00.000Z"
};

describe("forum view model", () => {
  it("formats thread dates for Chinese readers", () => {
    expect(formatThreadDate("2026-06-03T08:15:00.000Z")).toBe("2026/06/03 16:15");
  });

  it("maps board summaries to select options in order", () => {
    expect(getBoardOptions([board])).toEqual([
      {
        value: "board_1",
        label: "后端开发"
      }
    ]);
  });

  it("splits comma and whitespace separated tags", () => {
    expect(splitTags("nestjs, architecture  api")).toEqual(["nestjs", "architecture", "api"]);
  });

  it("builds forum hrefs", () => {
    expect(getThreadHref(thread)).toBe("/threads/thread_1");
    expect(getBoardHref(board)).toBe("/boards/backend");
  });
});
