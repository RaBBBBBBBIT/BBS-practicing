import Link from "next/link";
import type { BoardSummary, ThreadSummary } from "@bbs/shared";
import { fetchBoards, fetchThreads } from "../lib/forum-api";
import { formatThreadDate, getBoardHref, getThreadHref } from "../lib/forum-view-model";
import { getHomePageCopy } from "../lib/home-copy";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const copy = getHomePageCopy();

  try {
    const [boards, threads] = await Promise.all([fetchBoards(), fetchThreads()]);

    return (
      <main className="page-shell">
        <ForumHeader title={copy.title} subtitle={copy.subtitle} />
        <section className="forum-layout" aria-label="论坛首页">
          <aside className="sidebar" aria-label="分区列表">
            <div className="section-heading">
              <h2>分区</h2>
              <span>{boards.length} 个</span>
            </div>
            <BoardList boards={boards} />
          </aside>
          <section className="content-area" aria-label="最新主题">
            <div className="section-heading">
              <h2>最新主题</h2>
              <Link className="secondary-action" href="/threads/new">
                发布主题
              </Link>
            </div>
            <ThreadList threads={threads} />
          </section>
        </section>
      </main>
    );
  } catch {
    return (
      <main className="page-shell">
        <ForumHeader title={copy.title} subtitle={copy.subtitle} />
        <UnavailablePanel message="论坛数据暂时不可用" />
      </main>
    );
  }
}

function ForumHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="forum-header">
      <div>
        <p className="eyebrow">BBS Community</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <nav className="header-actions" aria-label="用户操作">
        <Link href="/login">登录</Link>
        <Link href="/register">注册</Link>
        <Link className="primary-action" href="/threads/new">
          发帖
        </Link>
      </nav>
    </header>
  );
}

function BoardList({ boards }: { boards: BoardSummary[] }) {
  if (boards.length === 0) {
    return <p className="empty-state">暂无分区。</p>;
  }

  return (
    <ul className="board-list">
      {boards.map((board) => (
        <li key={board.id}>
          <Link href={getBoardHref(board)}>
            <span>{board.name}</span>
            <small>{board.threadCount} 个主题</small>
          </Link>
          <p>{board.description}</p>
        </li>
      ))}
    </ul>
  );
}

function ThreadList({ threads }: { threads: ThreadSummary[] }) {
  if (threads.length === 0) {
    return <p className="empty-state">暂无主题。</p>;
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
              <span>{thread.authorUsername}</span>
              <span>{thread.boardName}</span>
              <time dateTime={thread.createdAt}>{formatThreadDate(thread.createdAt)}</time>
            </div>
          </div>
          <TagList tags={thread.tags} />
        </li>
      ))}
    </ul>
  );
}

function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="tag-list" aria-label="标签">
      {tags.map((tag) => (
        <span key={tag}>{tag}</span>
      ))}
    </div>
  );
}

function UnavailablePanel({ message }: { message: string }) {
  return (
    <section className="notice-panel" role="status">
      <h2>{message}</h2>
      <p>请稍后刷新页面，或确认本地 API 服务已经启动。</p>
    </section>
  );
}
