import Link from "next/link";
import { cookies } from "next/headers";
import { GlobalTopBar, CommunityTabs } from "../../components/community-chrome";
import { fetchConversationsWithCookie } from "../../lib/forum-api";
import { formatThreadDate } from "../../lib/forum-view-model";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  try {
    const conversations = await fetchConversationsWithCookie((await cookies()).toString());

    return (
      <>
        <GlobalTopBar />
        <main className="page-shell discussion-shell">
          <CommunityTabs active="members" />
          <section className="simple-panel">
            <header className="panel-header">
              <h1>私信</h1>
              <span>{conversations.length} 个会话</span>
            </header>
            <ul className="resource-list">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <Link className="thread-title" href={`/messages/${conversation.id}`}>
                    {conversation.participantUsername}
                  </Link>
                  <p>{conversation.lastMessageBody || "还没有消息"}</p>
                  <time dateTime={conversation.updatedAt}>{formatThreadDate(conversation.updatedAt)}</time>
                </li>
              ))}
            </ul>
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
            <h1>请先登录</h1>
            <p>登录后可以查看和发送一对一私信。</p>
          </section>
        </main>
      </>
    );
  }
}
