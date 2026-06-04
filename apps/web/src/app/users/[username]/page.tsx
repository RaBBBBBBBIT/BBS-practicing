import Link from "next/link";
import { GlobalTopBar } from "../../../components/community-chrome";
import { MessageComposer } from "../../../components/message-composer";
import { CompactThreadList } from "../../../components/thread-list";
import { fetchThreads, fetchUserProfile } from "../../../lib/forum-api";
import { formatThreadDate } from "../../../lib/forum-view-model";

export const dynamic = "force-dynamic";

interface UserPageProps {
  params: Promise<{ username: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params;

  try {
    const [user, threads] = await Promise.all([fetchUserProfile(username), fetchThreads({ q: username })]);

    return (
      <>
        <GlobalTopBar />
        <main className="page-shell discussion-shell">
          <section className="simple-panel profile-panel">
            <header className="panel-header">
              <div>
                <h1>{user.username}</h1>
                <p>
                  {user.role} · {user.status} · 加入于 {formatThreadDate(user.createdAt)}
                </p>
              </div>
              <Link className="secondary-action" href="/messages">
                查看私信
              </Link>
            </header>
            <dl className="profile-stats">
              <div>
                <dt>主题</dt>
                <dd>{user.threadCount}</dd>
              </div>
              <div>
                <dt>评论</dt>
                <dd>{user.commentCount}</dd>
              </div>
              <div>
                <dt>关注者</dt>
                <dd>{user.followerCount}</dd>
              </div>
              <div>
                <dt>正在关注</dt>
                <dd>{user.followingCount}</dd>
              </div>
            </dl>
            <MessageComposer recipientId={user.id} />
          </section>
          <section className="simple-panel">
            <header className="panel-header">
              <h2>相关讨论</h2>
              <span>{threads.length} 条</span>
            </header>
            <CompactThreadList threads={threads} />
          </section>
        </main>
      </>
    );
  } catch {
    return (
      <>
        <GlobalTopBar />
        <main className="page-shell">
          <section className="notice-panel">
            <h1>成员不存在</h1>
            <p>这个用户可能不存在，或本地 API 暂时不可用。</p>
          </section>
        </main>
      </>
    );
  }
}
