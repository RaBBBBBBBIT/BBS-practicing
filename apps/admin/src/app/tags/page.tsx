import { AdminShell, AdminUnavailable } from "../../components/admin-shell";
import { fetchAdminTags } from "../../lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  try {
    const tags = await fetchAdminTags();

    return (
      <AdminShell>
        <header className="admin-page-header">
          <h1>标签管理</h1>
          <p>查看标签状态和讨论数量。</p>
        </header>
        <section className="admin-panel">
          <table>
            <thead>
              <tr>
                <th>标签</th>
                <th>描述</th>
                <th>状态</th>
                <th>讨论数</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.name}</td>
                  <td>{tag.description}</td>
                  <td>{tag.status}</td>
                  <td>{tag.threadCount}</td>
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
