import { cookies } from "next/headers";
import { AdminShell, AdminUnavailable } from "../../components/admin-shell";
import { fetchAdminBoards } from "../../lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminBoardsPage() {
  try {
    const boards = await fetchAdminBoards({ cookie: (await cookies()).toString() });

    return (
      <AdminShell>
        <header className="admin-page-header">
          <h1>分区管理</h1>
          <p>查看分区状态和主题数量。</p>
        </header>
        <section className="admin-panel">
          <table>
            <thead>
              <tr>
                <th>分区</th>
                <th>标识</th>
                <th>状态</th>
                <th>主题数</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => (
                <tr key={board.id}>
                  <td>{board.name}</td>
                  <td>{board.slug}</td>
                  <td>{formatBoardStatus(board.status)}</td>
                  <td>{board.threadCount}</td>
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

function formatBoardStatus(status: string) {
  const labels: Record<string, string> = {
    open: "开放",
    closed: "关闭"
  };
  return labels[status] ?? status;
}
