import type { BoardSummary, ThreadDetail, ThreadSummary } from "@bbs/shared";

export interface BoardOption {
  value: string;
  label: string;
}

export function formatThreadDate(value: string): string {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
    .formatToParts(new Date(value))
    .reduce<Record<string, string>>((accumulator, part) => {
      accumulator[part.type] = part.value;
      return accumulator;
    }, {});

  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

export function getBoardOptions(boards: BoardSummary[]): BoardOption[] {
  return boards.map((board) => ({
    value: board.id,
    label: board.name
  }));
}

export function splitTags(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function getThreadHref(thread: ThreadSummary | ThreadDetail): string {
  return `/threads/${thread.id}`;
}

export function getBoardHref(board: BoardSummary): string {
  return `/boards/${board.slug}`;
}
