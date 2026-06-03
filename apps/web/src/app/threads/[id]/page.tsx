import Link from "next/link";
import { fetchThread } from "../../../lib/forum-api";
import { formatThreadDate } from "../../../lib/forum-view-model";

export const dynamic = "force-dynamic";

interface ThreadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const { id } = await params;

  try {
    const thread = await fetchThread(id);

    return (
      <main className="page-shell">
        <nav className="top-nav" aria-label="论坛导航">
          <Link href="/">首页</Link>
          <Link href={`/boards/${thread.boardSlug}`}>{thread.boardName}</Link>
          <Link href="/threads/new">发布主题</Link>
        </nav>
        <article className="thread-detail">
          <header>
            <p className="eyebrow">Thread</p>
            <h1>{thread.title}</h1>
            <div className="thread-meta">
              <span>{thread.authorUsername}</span>
              <Link href={`/boards/${thread.boardSlug}`}>{thread.boardName}</Link>
              <time dateTime={thread.createdAt}>{formatThreadDate(thread.createdAt)}</time>
            </div>
            {thread.tags.length > 0 ? (
              <div className="tag-list" aria-label="标签">
                {thread.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
          </header>
          <div className="thread-body">{thread.body}</div>
        </article>
      </main>
    );
  } catch (error) {
    if (isStatusError(error, 404)) {
      return (
        <main className="page-shell">
          <nav className="top-nav" aria-label="论坛导航">
            <Link href="/">首页</Link>
          </nav>
          <section className="notice-panel">
            <h1>主题不存在</h1>
            <p>这个主题可能已被删除、隐藏，或者链接地址有误。</p>
          </section>
        </main>
      );
    }

    return (
      <main className="page-shell">
        <nav className="top-nav" aria-label="论坛导航">
          <Link href="/">首页</Link>
        </nav>
        <section className="notice-panel" role="status">
          <h1>主题暂时不可用</h1>
          <p>请稍后刷新页面，或确认本地 API 服务已经启动。</p>
        </section>
      </main>
    );
  }
}

function isStatusError(error: unknown, status: number): boolean {
  return error instanceof Error && error.message.includes(`status ${status}`);
}
