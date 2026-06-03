import { ShellBadge } from "@bbs/ui";
import { getHomePageCopy } from "../lib/home-copy";

export default function HomePage() {
  const copy = getHomePageCopy();

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
