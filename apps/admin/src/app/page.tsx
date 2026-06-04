import { AdminShell, AdminUnavailable } from "../components/admin-shell";
import { fetchAdminDashboard } from "../lib/admin-api";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  try {
    const { dashboard, auditLogs } = await fetchAdminDashboard();

    return (
      <AdminShell>
        <header className="admin-page-header">
          <h1>管理后台</h1>
          <p>处理内容审核、举报、用户和分区治理。</p>
        </header>
        <section className="admin-metrics">
          <Metric label="用户" value={dashboard.userCount} />
          <Metric label="主题" value={dashboard.threadCount} />
          <Metric label="评论" value={dashboard.commentCount} />
          <Metric label="待处理举报" value={dashboard.openReportCount} />
          <Metric label="审核待办" value={dashboard.pendingReviewCount} />
        </section>
        <section className="admin-panel">
          <h2>近期审计</h2>
          <ul className="admin-list">
            {auditLogs.map((log) => (
              <li key={log.id}>
                <strong>{log.actorUsername}</strong>
                <span>
                  {log.action} · {log.targetType}:{log.targetId}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </AdminShell>
    );
  } catch {
    return <AdminUnavailable />;
  }
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
