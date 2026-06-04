import Link from "next/link";
import type { BoardSummary, ThreadSummary } from "@bbs/shared";
import { GlobalTopBar, CommunityTabs } from "../components/community-chrome";
import { TagList } from "../components/tag-list";
import { DiscussionThreadList } from "../components/thread-list";
import { fetchBoards, fetchThreads } from "../lib/forum-api";
import { getHomePageCopy } from "../lib/home-copy";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps = {}) {
  const copy = getHomePageCopy();
  const filters = parseThreadFilters(await searchParams);

  try {
    const [boards, threads] = await Promise.all([fetchBoards(), fetchThreads(filters)]);

    return (
      <>
        <GlobalTopBar />
        <main className="page-shell discussion-shell">
          <CommunityHeader title={copy.title} subtitle={copy.subtitle} badge={copy.badge} boards={boards} threads={threads} />
          <WorkbenchToolbar filters={filters} boards={boards} />
          <section className="discussion-layout" aria-label="开发者讨论工作台">
            <CategorySidebar boards={boards} activeBoardSlug={filters.boardSlug ?? ""} />
            <section className="discussion-main" aria-label="讨论列表">
              <div className="discussion-heading">
                <h2>讨论</h2>
                <span>{threads.length} 条开放讨论</span>
              </div>
              <DiscussionThreadList threads={threads} />
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

function WorkbenchToolbar({ filters, boards }: { filters: ThreadFilters; boards: BoardSummary[] }) {
  return (
    <form className="discussion-toolbar" aria-label="讨论筛选工具栏">
      <label className="discussion-search">
        <span className="sr-only">筛选讨论</span>
        <input type="search" name="q" placeholder="搜索标题、正文或作者..." defaultValue={filters.q ?? ""} />
      </label>
      <div className="filter-actions">
        <label className="toolbar-select">
          <span className="sr-only">排序</span>
          <select name="sort" defaultValue={filters.sort ?? "active"}>
            <option value="active">最近活跃</option>
            <option value="latest">最新发布</option>
            <option value="popular">热度最高</option>
            <option value="oldest">最早发布</option>
          </select>
        </label>
        <label className="toolbar-select">
          <span className="sr-only">分区</span>
          <select name="boardSlug" defaultValue={filters.boardSlug ?? ""}>
            <option value="">全部分区</option>
            {boards.map((board) => (
              <option key={board.id} value={board.slug}>
                {board.name}
              </option>
            ))}
          </select>
        </label>
        <input name="tag" type="hidden" value={filters.tag ?? ""} />
        <button className="toolbar-button" type="submit">
          筛选
        </button>
        <Link className="primary-action" href="/threads/new">
          发起讨论
        </Link>
      </div>
    </form>
  );
}

function CategorySidebar({ boards, activeBoardSlug }: { boards: BoardSummary[]; activeBoardSlug?: string }) {
  if (boards.length === 0) {
    return <p className="empty-state">暂无分区。</p>;
  }

  const totalThreadCount = boards.reduce((total, board) => total + board.threadCount, 0);

  return (
    <aside className="category-sidebar" id="categories" aria-label="分区">
      <h2>分区</h2>
      <nav className="category-list" aria-label="讨论分区">
        <Link className={`category-item ${activeBoardSlug ? "" : "is-active"}`} href="/">
          <span className="category-dot category-all" aria-hidden="true" />
          <span>查看全部讨论</span>
          <small>{totalThreadCount}</small>
        </Link>
        {boards.map((board) => (
          <Link
            className={`category-item ${activeBoardSlug === board.slug ? "is-active" : ""}`}
            key={board.id}
            href={`/?boardSlug=${encodeURIComponent(board.slug)}`}
            title={board.description}
          >
            <span className={`category-dot category-${board.slug}`} aria-hidden="true" />
            <span>{board.name}</span>
            <small>{board.threadCount}</small>
          </Link>
        ))}
      </nav>
    </aside>
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

interface ThreadFilters {
  boardSlug?: string | undefined;
  q?: string | undefined;
  tag?: string | undefined;
  sort?: "latest" | "oldest" | "active" | "popular";
}

function parseThreadFilters(searchParams?: Record<string, string | string[] | undefined>): ThreadFilters {
  const sort = getSingleParam(searchParams?.sort);

  return {
    boardSlug: getSingleParam(searchParams?.boardSlug),
    q: getSingleParam(searchParams?.q),
    tag: getSingleParam(searchParams?.tag),
    sort: sort === "latest" || sort === "oldest" || sort === "popular" || sort === "active" ? sort : "active"
  };
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value || undefined;
}
