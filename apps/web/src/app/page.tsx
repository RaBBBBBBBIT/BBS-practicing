import Link from "next/link";
import type { BoardSummary, ThreadSummary } from "@bbs/shared";
import { GlobalTopBar, CommunityTabs } from "../components/community-chrome";
import { TagList } from "../components/tag-list";
import { fetchBoards, fetchThreads } from "../lib/forum-api";
import { formatThreadDate, getBoardHref, getThreadHref } from "../lib/forum-view-model";
import { getHomePageCopy } from "../lib/home-copy";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const copy = getHomePageCopy();

  try {
    const [boards, threads] = await Promise.all([fetchBoards(), fetchThreads()]);

    return (
      <>
        <GlobalTopBar />
        <main className="page-shell discussion-shell">
          <CommunityHeader title={copy.title} subtitle={copy.subtitle} badge={copy.badge} boards={boards} threads={threads} />
          <WorkbenchToolbar />
          <section className="discussion-layout" aria-label="开发者讨论工作台">
            <CategorySidebar boards={boards} />
            <section className="discussion-main" aria-label="讨论列表">
              <div className="discussion-heading">
                <h2>讨论</h2>
                <span>{threads.length} 条开放讨论</span>
              </div>
              <ThreadList threads={threads} />
            </section>
            <CommunitySidebar boards={boards} threads={threads} />
          </section>
        </main>
      </>
    );
  } catch {
    return (
      <>
        <GlobalTopBar />
        <main className="page-shell discussion-shell">
          <CommunityHeader title={copy.title} subtitle={copy.subtitle} badge={copy.badge} boards={[]} threads={[]} />
          <UnavailablePanel message="论坛数据暂时不可用" />
        </main>
      </>
    );
  }
}

function CommunityHeader({
  title,
  subtitle,
  badge,
  boards,
  threads
}: {
  title: string;
  subtitle: string;
  badge: string;
  boards: BoardSummary[];
  threads: ThreadSummary[];
}) {
  const labelCount = new Set(threads.flatMap((thread) => thread.tags)).size;

  return (
    <header className="community-header">
      <div className="community-title">
        <span className="community-mark" aria-hidden="true">
          #
        </span>
        <div>
          <p>{badge}</p>
          <h1>{title}</h1>
        </div>
        <span className="visibility-badge">公开</span>
      </div>
      <p>{subtitle}</p>
      <CommunityTabs active="overview" />
      <div className="community-stats" aria-label="社区统计">
        <span>{threads.length} 条讨论</span>
        <span>{boards.length} 个分区</span>
        <span>{labelCount} 个标签</span>
      </div>
    </header>
  );
}

function WorkbenchToolbar() {
  return (
    <section className="discussion-toolbar" aria-label="讨论筛选工具栏">
      <label className="discussion-search">
        <span className="sr-only">筛选讨论</span>
        <input type="search" defaultValue="is:open" />
      </label>
      <div className="filter-actions">
        <button className="toolbar-button" type="button">
          排序：最近活跃
        </button>
        <button className="toolbar-button" type="button">
          标签
        </button>
        <button className="toolbar-button" type="button">
          分区
        </button>
        <Link className="primary-action" href="/threads/new">
          发起讨论
        </Link>
      </div>
    </section>
  );
}

function CategorySidebar({ boards }: { boards: BoardSummary[] }) {
  if (boards.length === 0) {
    return <p className="empty-state">暂无分区。</p>;
  }

  const totalThreadCount = boards.reduce((total, board) => total + board.threadCount, 0);

  return (
    <aside className="category-sidebar" id="categories" aria-label="分区">
      <h2>分区</h2>
      <nav className="category-list" aria-label="讨论分区">
        <Link className="category-item is-active" href="/">
          <span className="category-dot category-all" aria-hidden="true" />
          <span>查看全部讨论</span>
          <small>{totalThreadCount}</small>
        </Link>
        {boards.map((board) => (
          <Link className="category-item" key={board.id} href={getBoardHref(board)} title={board.description}>
            <span className={`category-dot category-${board.slug}`} aria-hidden="true" />
            <span>{board.name}</span>
            <small>{board.threadCount}</small>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function ThreadList({ threads }: { threads: ThreadSummary[] }) {
  if (threads.length === 0) {
    return (
      <div className="empty-state discussion-empty">
        <h3>暂无开放讨论</h3>
        <p>导入演示数据或发布第一条主题后，这里会展示讨论列表。</p>
      </div>
    );
  }

  return (
    <ul className="discussion-list" id="discussions">
      {threads.map((thread, index) => (
        <li className="discussion-row" key={thread.id}>
          <div className="discussion-status" aria-hidden="true">
            {getStatusIcon(thread, index)}
          </div>
          <div className="discussion-content">
            <div className="discussion-title-row">
              <Link className="thread-title" href={getThreadHref(thread)}>
                {thread.title}
              </Link>
              <TagList tags={getDisplayTags(thread, index)} />
            </div>
            <p>{thread.excerpt}</p>
            <div className="thread-meta">
              <span>
                #{index + 1} 由 {thread.authorUsername} 于 {formatRelativeActivity(thread.createdAt)} 发起
              </span>
              <span>分区：{thread.boardName}</span>
            </div>
          </div>
          <div className="discussion-metrics" aria-label="讨论热度">
            <span>{getCommentCount(index)} 条评论</span>
            <span>{getViewCount(index)} 次浏览</span>
            <time dateTime={thread.updatedAt}>{formatRelativeActivity(thread.updatedAt)}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CommunitySidebar({ boards, threads }: { boards: BoardSummary[]; threads: ThreadSummary[] }) {
  const labels = Array.from(new Set(threads.flatMap((thread) => thread.tags))).slice(0, 8);
  const maintainers = Array.from(new Set(threads.map((thread) => thread.authorUsername))).slice(0, 4);

  return (
    <aside className="community-sidebar" aria-label="社区信息">
      <section>
        <h2>关于社区</h2>
        <p>面向开发者的问题、实践和运行经验讨论区。</p>
      </section>
      <section>
        <h2>社区统计</h2>
        <dl className="sidebar-stats">
          <div>
            <dt>讨论</dt>
            <dd>{threads.length}</dd>
          </div>
          <div>
            <dt>分区</dt>
            <dd>{boards.length}</dd>
          </div>
        </dl>
      </section>
      <section id="labels">
        <h2>热门标签</h2>
        {labels.length > 0 ? <TagList tags={labels} /> : <p className="sidebar-muted">暂无标签</p>}
      </section>
      <section id="members">
        <h2>活跃维护者</h2>
        <ul className="maintainer-list">
          {maintainers.map((maintainer) => (
            <li key={maintainer}>
              <span className="avatar-dot" aria-hidden="true" />
              {maintainer}
            </li>
          ))}
        </ul>
      </section>
    </aside>
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

function getStatusIcon(thread: ThreadSummary, index: number): string {
  if (thread.tags.includes("solved")) {
    return "✓";
  }

  if (index === 0) {
    return "!";
  }

  return "○";
}

function getDisplayTags(thread: ThreadSummary, index: number): string[] {
  const statusTag = index % 3 === 0 ? "unanswered" : "open";
  return [...thread.tags, statusTag].slice(0, 5);
}

function getCommentCount(index: number): number {
  return [8, 4, 2, 1][index % 4] ?? 1;
}

function getViewCount(index: number): number {
  return [128, 96, 64, 32][index % 4] ?? 24;
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
