import { GlobalTopBar, CommunityTabs } from "../../components/community-chrome";
import { fetchNotifications } from "../../lib/forum-api";
import { formatThreadDate } from "../../lib/forum-view-model";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  try {
    const notifications = await fetchNotifications();

    return (
      <>
        <GlobalTopBar />
        <main className="page-shell discussion-shell">
          <CommunityTabs active="overview" />
          <section className="simple-panel">
            <header className="panel-header">
              <h1>通知</h1>
              <span>{notifications.length} 条</span>
            </header>
            <ul className="resource-list">
              {notifications.map((notification) => (
                <li key={notification.id} className={notification.isRead ? "" : "is-unread"}>
                  <strong>{notification.title}</strong>
                  <p>{notification.body}</p>
                  <time dateTime={notification.createdAt}>{formatThreadDate(notification.createdAt)}</time>
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
            <p>登录后可以查看评论、点赞、关注、私信和审核结果通知。</p>
          </section>
        </main>
      </>
    );
  }
}
