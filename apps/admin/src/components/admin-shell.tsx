import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "仪表盘" },
  { href: "/reports", label: "举报处理" },
  { href: "/threads", label: "主题审核" },
  { href: "/users", label: "用户管理" },
  { href: "/boards", label: "分区管理" },
  { href: "/tags", label: "标签管理" }
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="后台导航">
        <div className="admin-brand">
          <span>B</span>
          <strong>BBS 管理后台</strong>
        </div>
        <nav>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="admin-content">{children}</section>
    </main>
  );
}

export function AdminUnavailable() {
  return (
    <AdminShell>
      <section className="admin-panel">
        <h1>后台数据暂时不可用</h1>
        <p>请确认 API 服务已启动，并使用管理员或版主账号登录后刷新后台。</p>
      </section>
    </AdminShell>
  );
}
