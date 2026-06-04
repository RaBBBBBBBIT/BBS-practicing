import { AdminShell, AdminUnavailable } from "../../components/admin-shell";
import { fetchAdminReports } from "../../lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  try {
    const reports = await fetchAdminReports();

    return (
      <AdminShell>
        <header className="admin-page-header">
          <h1>举报处理</h1>
          <p>查看用户提交的主题和评论举报。</p>
        </header>
        <section className="admin-panel">
          <table>
            <thead>
              <tr>
                <th>对象</th>
                <th>原因</th>
                <th>状态</th>
                <th>举报人</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.targetType}:{report.targetId}</td>
                  <td>{report.reason}</td>
                  <td>{report.status}</td>
                  <td>{report.reporterUsername}</td>
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
