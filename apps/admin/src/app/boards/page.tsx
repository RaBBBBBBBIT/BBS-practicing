import { AdminShell, AdminUnavailable } from "../../components/admin-shell";
import { fetchAdminBoards } from "../../lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminBoardsPage() {
  try {
    const boards = await fetchAdminBoards();

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
                <th>Slug</th>
                <th>状态</th>
                <th>主题数</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => (
                <tr key={board.id}>
                  <td>{board.name}</td>
                  <td>{board.slug}</td>
                  <td>{board.status}</td>
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
