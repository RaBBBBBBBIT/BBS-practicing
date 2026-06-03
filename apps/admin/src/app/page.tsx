import { ShellBadge } from "@bbs/ui";
import { getDashboardCopy } from "../lib/dashboard-copy";

export default function AdminDashboardPage() {
  const copy = getDashboardCopy();

  return (
    <main>
      <section className="shell">
        <ShellBadge label={copy.badge} />
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </section>
    </main>
  );
}
