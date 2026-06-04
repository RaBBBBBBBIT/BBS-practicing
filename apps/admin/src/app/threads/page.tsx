import { AdminShell, AdminUnavailable } from "../../components/admin-shell";
import { fetchAdminThreads } from "../../lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminThreadsPage() {
  try {
    const threads = await fetchAdminThreads();

    return (
      <AdminShell>
        <header className="admin-page-header">
          <h1>主题审核</h1>
          <p>查看主题状态、置顶和锁定情况。</p>
        </header>
        <section className="admin-panel">
          <table>
            <thead>
              <tr>
                <th>标题</th>
                <th>分区</th>
                <th>状态</th>
                <th>互动</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.id}>
                  <td>{thread.title}</td>
                  <td>{thread.boardName}</td>
                  <td>{thread.status}{thread.isLocked ? " · locked" : ""}{thread.isPinned ? " · pinned" : ""}</td>
                  <td>{thread.commentCount} 评论 · {thread.reactionCount} 点赞</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </AdminShell>
    );
  } catch {
    return <AdminUnavailable />;
  }
}
