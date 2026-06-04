import { AdminShell, AdminUnavailable } from "../../components/admin-shell";
import { fetchAdminUsers } from "../../lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  try {
    const users = await fetchAdminUsers();

    return (
      <AdminShell>
        <header className="admin-page-header">
          <h1>用户管理</h1>
          <p>查看用户角色、状态和内容数量。</p>
        </header>
        <section className="admin-panel">
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>内容</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>{user.threadCount} 主题 · {user.commentCount} 评论</td>
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
