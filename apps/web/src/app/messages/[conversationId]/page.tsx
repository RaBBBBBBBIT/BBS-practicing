import Link from "next/link";
import { GlobalTopBar } from "../../../components/community-chrome";
import { fetchConversationMessages } from "../../../lib/forum-api";
import { formatThreadDate } from "../../../lib/forum-view-model";

export const dynamic = "force-dynamic";

interface MessageThreadPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function MessageThreadPage({ params }: MessageThreadPageProps) {
  const { conversationId } = await params;

  try {
    const messages = await fetchConversationMessages(conversationId);

    return (
      <>
        <GlobalTopBar />
        <main className="page-shell discussion-shell">
          <nav className="top-nav">
            <Link href="/messages">返回私信</Link>
          </nav>
          <section className="simple-panel">
            <header className="panel-header">
              <h1>会话</h1>
              <span>{messages.length} 条消息</span>
            </header>
            <ul className="resource-list message-list">
              {messages.map((message) => (
                <li key={message.id}>
                  <strong>{message.senderUsername}</strong>
                  <p>{message.body}</p>
                  <time dateTime={message.createdAt}>{formatThreadDate(message.createdAt)}</time>
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
            <h1>会话不可用</h1>
            <p>请确认已登录，或者这个会话属于当前账号。</p>
          </section>
        </main>
      </>
    );
  }
}
