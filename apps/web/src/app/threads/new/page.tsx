import Link from "next/link";
import { ThreadForm } from "../../../components/thread-form";
import { fetchBoards } from "../../../lib/forum-api";

export const dynamic = "force-dynamic";

export default async function NewThreadPage() {
  try {
    const boards = await fetchBoards();

    return (
      <main className="page-shell narrow">
        <nav className="top-nav" aria-label="论坛导航">
          <Link href="/">首页</Link>
          <Link href="/login">登录</Link>
        </nav>
        <section className="posting-layout">
          <p className="eyebrow">新讨论</p>
          <h1>发布主题</h1>
          <p>选择分区，写下问题、经验或实践记录。</p>
          <ThreadForm boards={boards} />
        </section>
      </main>
    );
  } catch {
    return (
      <main className="page-shell narrow">
        <nav className="top-nav" aria-label="论坛导航">
          <Link href="/">首页</Link>
        </nav>
        <section className="notice-panel" role="status">
          <h1>论坛数据暂时不可用</h1>
          <p>请稍后刷新页面，或确认本地 API 服务已经启动。</p>
        </section>
      </main>
    );
  }
}
