import Link from "next/link";
import { GlobalTopBar, CommunityTabs } from "../../components/community-chrome";
import { fetchUsers } from "../../lib/forum-api";
import { formatThreadDate } from "../../lib/forum-view-model";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const users = await fetchUsers();

  return (
    <>
      <GlobalTopBar />
      <main className="page-shell discussion-shell">
        <CommunityTabs active="members" />
        <section className="simple-panel">
          <header className="panel-header">
            <h1>成员</h1>
            <span>{users.length} 人</span>
          </header>
          <ul className="resource-grid">
            {users.map((user) => (
              <li key={user.id}>
                <Link className="thread-title" href={`/users/${encodeURIComponent(user.username)}`}>
                  {user.username}
                </Link>
                <p>
                  {user.threadCount} 条主题 · {user.commentCount} 条评论 · {user.followerCount} 个关注者
                </p>
                <time dateTime={user.createdAt}>加入于 {formatThreadDate(user.createdAt)}</time>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
