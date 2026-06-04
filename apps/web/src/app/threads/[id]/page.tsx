import Link from "next/link";
import type { ReactNode } from "react";
import type { CommentSummary, ThreadDetail } from "@bbs/shared";
import { CommentForm } from "../../../components/comment-form";
import { GlobalTopBar, CommunityTabs } from "../../../components/community-chrome";
import { TagList } from "../../../components/tag-list";
import { fetchThread } from "../../../lib/forum-api";
import { formatThreadDate } from "../../../lib/forum-view-model";

export const dynamic = "force-dynamic";

interface ThreadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const { id } = await params;

  try {
    const thread = await fetchThread(id);
    const comments = thread.comments;
    const participants = getParticipants(thread, comments);
    const answerStatus = getAnswerStatus(thread, comments);

    return (
      <DetailChrome>
        <ThreadTitleBar thread={thread} answerStatus={answerStatus} />
        <section className="thread-detail-layout">
          <section className="discussion-timeline" aria-label="评论时间线">
            <CommentCard
              authorUsername={thread.authorUsername}
              body={thread.body}
              createdAt={thread.createdAt}
              marker="发起于"
            />
            {comments.map((comment) => (
              <CommentCard
                authorUsername={comment.authorUsername}
                body={comment.body}
                createdAt={comment.createdAt}
                key={comment.id}
                marker="评论于"
              />
            ))}
            <CommentComposer threadId={thread.id} />
          </section>
          <ThreadSidebar answerStatus={answerStatus} comments={comments} participants={participants} thread={thread} />
        </section>
      </DetailChrome>
    );
  } catch (error) {
    if (isStatusError(error, 404)) {
      return (
        <DetailChrome>
          <section className="notice-panel">
            <h1>主题不存在</h1>
            <p>这个主题可能已被删除、隐藏，或者链接地址有误。</p>
          </section>
        </DetailChrome>
      );
    }

    return (
      <DetailChrome>
        <section className="notice-panel" role="status">
          <h1>主题暂时不可用</h1>
          <p>请稍后刷新页面，或确认本地 API 服务已经启动。</p>
        </section>
      </DetailChrome>
    );
  }
}

function DetailChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <GlobalTopBar />
      <main className="page-shell discussion-shell thread-page-shell">
        <section className="thread-community-header" aria-label="社区">
          <div className="community-title">
            <span className="community-mark" aria-hidden="true">
              #
            </span>
            <div>
              <p>BBS 社区</p>
              <h1>开发者讨论工作台</h1>
            </div>
            <span className="visibility-badge">公开</span>
          </div>
          <CommunityTabs active="discussions" />
        </section>
        {children}
      </main>
    </>
  );
}

function ThreadTitleBar({ thread, answerStatus }: { thread: ThreadDetail; answerStatus: AnswerStatus }) {
  return (
    <header className="thread-titlebar">
      <div className="thread-title-copy">
        <div className="thread-title-line">
          <h1>{thread.title}</h1>
          <div className="status-pill-group" aria-label="讨论状态">
            <span className="status-pill status-open">开放</span>
            <span className={`status-pill ${answerStatus.className}`}>{answerStatus.label}</span>
          </div>
        </div>
        <p>
          <strong>{thread.authorUsername}</strong> 于 <time dateTime={thread.createdAt}>{formatThreadDate(thread.createdAt)}</time> 在{" "}
          <Link href={`/boards/${thread.boardSlug}`}>{thread.boardName}</Link> 发起了这条讨论
        </p>
      </div>
      <div className="thread-actions" aria-label="讨论操作">
        <Link className="primary-action" href="/threads/new">
          发起讨论
        </Link>
        <button className="toolbar-button" type="button">
          编辑
        </button>
        <button className="toolbar-button" type="button">
          订阅
        </button>
      </div>
    </header>
  );
}

function CommentCard({
  authorUsername,
  body,
  createdAt,
  marker
}: {
  authorUsername: string;
  body: string;
  createdAt: string;
  marker: string;
}) {
  return (
    <article className="timeline-item">
      <Avatar username={authorUsername} />
      <div className="comment-card">
        <header className="comment-card-header">
          <strong>{authorUsername}</strong>
          <span>
            {marker} <time dateTime={createdAt}>{formatThreadDate(createdAt)}</time>
          </span>
        </header>
        <div className="comment-card-body markdown-body">{renderInlineMarkdown(body)}</div>
      </div>
    </article>
  );
}

function CommentComposer({ threadId }: { threadId: string }) {
  return (
    <section className="timeline-item comment-composer" aria-label="回复讨论">
      <Avatar username="访客" />
      <CommentForm threadId={threadId} />
    </section>
  );
}

function ThreadSidebar({
  answerStatus,
  comments,
  participants,
  thread
}: {
  answerStatus: AnswerStatus;
  comments: CommentSummary[];
  participants: string[];
  thread: ThreadDetail;
}) {
  return (
    <aside className="thread-sidebar" aria-label="讨论详情">
      <section>
        <h2>分区</h2>
        <Link className="sidebar-link" href={`/boards/${thread.boardSlug}`}>
          {thread.boardName}
        </Link>
      </section>
      <section>
        <h2>标签</h2>
        <TagList tags={thread.tags} />
      </section>
      <section>
        <h2>参与者</h2>
        <div className="participant-stack">
          {participants.map((participant) => (
            <Avatar key={participant} username={participant} compact />
          ))}
        </div>
      </section>
      <section>
        <h2>状态</h2>
        <div className="sidebar-status">
          <span className="status-pill status-open">开放</span>
          <span className={`status-pill ${answerStatus.className}`}>{answerStatus.label}</span>
        </div>
      </section>
      <section>
        <h2>创建时间</h2>
        <time dateTime={thread.createdAt}>{formatThreadDate(thread.createdAt)}</time>
      </section>
      <section>
        <h2>更新时间</h2>
        <time dateTime={thread.updatedAt}>{formatThreadDate(thread.updatedAt)}</time>
      </section>
      <section>
        <h2>相关讨论</h2>
        <Link className="sidebar-link" href={`/#discussions`}>
          查看 {thread.boardName} 的更多讨论
        </Link>
        <p>{comments.length > 0 ? `当前有 ${comments.length} 条真实评论。` : "当前还没有评论。"}</p>
      </section>
    </aside>
  );
}

function Avatar({ username, compact = false }: { username: string; compact?: boolean }) {
  return (
    <span className={compact ? "timeline-avatar participant-avatar" : "timeline-avatar"} title={username} aria-label={username}>
      {username.slice(0, 1).toUpperCase()}
    </span>
  );
}

interface AnswerStatus {
  label: string;
  className: string;
}

function getParticipants(thread: ThreadDetail, comments: CommentSummary[]): string[] {
  return Array.from(new Set([thread.authorUsername, ...comments.map((comment) => comment.authorUsername)]));
}

function getAnswerStatus(thread: ThreadDetail, comments: CommentSummary[]): AnswerStatus {
  if (thread.tags.includes("solved")) {
    return { label: "已解决", className: "status-solved" };
  }

  if (thread.tags.includes("answered") || comments.length > 0) {
    return { label: "已回复", className: "status-solved" };
  }

  return { label: "待回复", className: "status-unanswered" };
}

function renderInlineMarkdown(value: string) {
  return value.split(/(`[^`]+`)/g).map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`") && segment.length > 2) {
      return <code key={`${segment}-${index}`}>{segment.slice(1, -1)}</code>;
    }

    return <span key={`${segment}-${index}`}>{segment}</span>;
  });
}

function isStatusError(error: unknown, status: number): boolean {
  return error instanceof Error && error.message.includes(`status ${status}`);
}
