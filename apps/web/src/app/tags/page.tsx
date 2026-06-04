import Link from "next/link";
import { GlobalTopBar, CommunityTabs } from "../../components/community-chrome";
import { fetchTags } from "../../lib/forum-api";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await fetchTags();

  return (
    <>
      <GlobalTopBar />
      <main className="page-shell discussion-shell">
        <CommunityTabs active="labels" />
        <section className="simple-panel">
          <header className="panel-header">
            <h1>标签</h1>
            <span>{tags.length} 个</span>
          </header>
          <ul className="resource-grid">
            {tags.map((tag) => (
              <li key={tag.id}>
                <Link className="thread-title" href={`/?tag=${encodeURIComponent(tag.name)}`}>
                  {tag.name}
                </Link>
                <p>{tag.description || "暂无描述"}</p>
                <span>{tag.threadCount} 条讨论</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
