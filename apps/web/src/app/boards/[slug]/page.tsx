import Link from "next/link";
import type { ThreadSummary } from "@bbs/shared";
import { fetchBoards, fetchThreads } from "../../../lib/forum-api";
import { formatThreadDate, getBoardHref, getThreadHref } from "../../../lib/forum-view-model";

export const dynamic = "force-dynamic";

interface BoardPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug } = await params;

  try {
    const [boards, threads] = await Promise.all([fetchBoards(), fetchThreads({ boardSlug: slug })]);
    const currentBoard = boards.find((board) => board.slug === slug);

    if (!currentBoard) {
      return (
        <main className="page-shell">
          <TopNav />
          <section className="notice-panel">
            <h1>分区不存在</h1>
            <p>这个分区可能已被移除，或者链接地址有误。</p>
          </section>
        </main>
      );
    }

    return (
      <main className="page-shell">
        <TopNav />
        <section className="board-page">
          <aside className="sidebar" aria-label="所有分区">
            <div className="section-heading">
              <h2>分区</h2>
              <span>{boards.length} 个</span>
            </div>
            <ul className="board-list compact">
              {boards.map((board) => (
                <li key={board.id} className={board.slug === slug ? "is-active" : undefined}>
                  <Link href={getBoardHref(board)}>
                    <span>{board.name}</span>
                    <small>{board.threadCount} 个主题</small>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
          <section className="content-area">
            <header className="board-header">
              <p className="eyebrow">Board</p>
              <h1>{currentBoard.name}</h1>
              <p>{currentBoard.description}</p>
              <span>{currentBoard.threadCount} 个已发布主题</span>
            </header>
            <ThreadList threads={threads} />
          </section>
        </section>
      </main>
    );
  } catch {
    return (
      <main className="page-shell">
        <TopNav />
        <section className="notice-panel" role="status">
          <h1>论坛数据暂时不可用</h1>
          <p>请稍后刷新页面，或确认本地 API 服务已经启动。</p>
        </section>
      </main>
    );
  }
}

function TopNav() {
  return (
    <nav className="top-nav" aria-label="论坛导航">
      <Link href="/">首页</Link>
      <Link href="/threads/new">发布主题</Link>
    </nav>
  );
}

function ThreadList({ threads }: { threads: ThreadSummary[] }) {
  if (threads.length === 0) {
    return <p className="empty-state">这个分区还没有主题。</p>;
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
              <time dateTime={thread.createdAt}>{formatThreadDate(thread.createdAt)}</time>
            </div>
          </div>
          {thread.tags.length > 0 ? (
            <div className="tag-list" aria-label="标签">
              {thread.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
