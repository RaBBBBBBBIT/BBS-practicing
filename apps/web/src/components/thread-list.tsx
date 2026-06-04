import Link from "next/link";
import type { ThreadSummary } from "@bbs/shared";
import { formatThreadDate, getThreadHref } from "../lib/forum-view-model";
import { TagList } from "./tag-list";

export function DiscussionThreadList({ threads }: { threads: ThreadSummary[] }) {
  if (threads.length === 0) {
    return (
      <div className="empty-state discussion-empty">
        <h3>暂无开放讨论</h3>
        <p>调整筛选条件或发布第一条主题后，这里会展示讨论列表。</p>
      </div>
    );
  }

  return (
    <ul className="discussion-list" id="discussions">
      {threads.map((thread, index) => (
        <li className="discussion-row" key={thread.id}>
          <div className="discussion-status" aria-hidden="true">
            {getStatusIcon(thread)}
          </div>
          <div className="discussion-content">
            <div className="discussion-title-row">
              <Link className="thread-title" href={getThreadHref(thread)}>
                {thread.title}
              </Link>
              <TagList tags={getDisplayTags(thread)} />
            </div>
            <p>{thread.excerpt}</p>
            <div className="thread-meta">
              <span>
                #{index + 1} 由{" "}
                <Link href={`/users/${encodeURIComponent(thread.authorUsername)}`}>{thread.authorUsername}</Link> 于{" "}
                {formatRelativeActivity(thread.createdAt)} 发起
              </span>
              <span>分区：{thread.boardName}</span>
            </div>
          </div>
          <div className="discussion-metrics" aria-label="讨论热度">
            <span>{thread.commentCount} 条评论</span>
            <span>{thread.reactionCount} 个点赞</span>
            <span>{thread.viewCount} 次浏览</span>
            <time dateTime={thread.updatedAt}>{formatRelativeActivity(thread.updatedAt)}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CompactThreadList({ threads }: { threads: ThreadSummary[] }) {
  if (threads.length === 0) {
    return <p className="empty-state">这个筛选下还没有主题。</p>;
  }

  return (
    <ul className="thread-list">
      {threads.map((thread) => (
        <li key={thread.id}>
          <div className="thread-main">
            <Link className="thread-title" href={getThreadHref(thread)}>
              {thread.title}
            </Link>
            <p>{thread.excerpt}</p>
            <div className="thread-meta">
              <Link href={`/users/${encodeURIComponent(thread.authorUsername)}`}>{thread.authorUsername}</Link>
              <time dateTime={thread.createdAt}>{formatThreadDate(thread.createdAt)}</time>
              <span>{thread.commentCount} 条评论</span>
              <span>{thread.reactionCount} 个点赞</span>
            </div>
          </div>
          <TagList tags={thread.tags} />
        </li>
      ))}
    </ul>
  );
}

function getStatusIcon(thread: ThreadSummary): string {
  if (thread.isPinned) {
    return "!";
  }

  if (thread.tags.includes("solved")) {
    return "✓";
  }

  return "○";
}

function getDisplayTags(thread: ThreadSummary): string[] {
  const stateTags = [thread.isLocked ? "locked" : "open"];
  return [...thread.tags, ...stateTags].slice(0, 5);
}

function formatRelativeActivity(value: string): string {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return formatThreadDate(value);
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} 天前`;
  }

  if (hours > 0) {
    return `${hours} 小时前`;
  }

  if (minutes > 0) {
    return `${minutes} 分钟前`;
  }

  return "刚刚";
}
