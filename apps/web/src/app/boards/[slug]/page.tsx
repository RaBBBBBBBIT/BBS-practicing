import Link from "next/link";
import { CompactThreadList } from "../../../components/thread-list";
import { fetchBoards, fetchThreads } from "../../../lib/forum-api";
import { getBoardHref } from "../../../lib/forum-view-model";

export const dynamic = "force-dynamic";

interface BoardPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { slug } = await params;
  const filters = parseBoardFilters(await searchParams);

  try {
    const [boards, threads] = await Promise.all([fetchBoards(), fetchThreads({ ...filters, boardSlug: slug })]);
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
              <form className="board-filterbar" aria-label="分区筛选">
                <input type="search" name="q" placeholder="搜索这个分区..." defaultValue={filters.q ?? ""} />
                <select name="sort" defaultValue={filters.sort ?? "active"}>
                  <option value="active">最近活跃</option>
                  <option value="latest">最新发布</option>
                  <option value="popular">热度最高</option>
                  <option value="oldest">最早发布</option>
                </select>
                <button className="toolbar-button" type="submit">
                  筛选
                </button>
              </form>
            </header>
            <CompactThreadList threads={threads} />
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

interface BoardFilters {
  q?: string | undefined;
  sort?: "latest" | "oldest" | "active" | "popular";
}

function parseBoardFilters(searchParams?: Record<string, string | string[] | undefined>): BoardFilters {
  const sort = getSingleParam(searchParams?.sort);

  return {
    q: getSingleParam(searchParams?.q),
    sort: sort === "latest" || sort === "oldest" || sort === "popular" || sort === "active" ? sort : "active"
  };
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value || undefined;
}
