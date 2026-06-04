"use client";

import { ReportReason, type ThreadDetail } from "@bbs/shared";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  bookmarkThread,
  createReport,
  followUser,
  getCurrentUser,
  reactToThread,
  removeThreadBookmark,
  removeThreadReaction,
  unfollowUser,
  updateThread
} from "../lib/forum-api";

export function ThreadActionPanel({ thread }: { thread: ThreadDetail }) {
  const router = useRouter();
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isReacted, setIsReacted] = useState(thread.viewerHasReacted);
  const [isBookmarked, setIsBookmarked] = useState(thread.viewerHasBookmarked);
  const [isFollowing, setIsFollowing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getCurrentUser()
      .then((user) => {
        if (mounted) {
          setViewerId(user?.id ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setViewerId(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setMessage(null);
    try {
      await action();
      setMessage(success);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error && error.message.includes("status 401") ? "请先登录后再操作。" : "操作失败，请稍后重试。");
    }
  }

  return (
    <div className="thread-action-panel" aria-label="讨论互动">
      <button
        className="toolbar-button"
        type="button"
        onClick={() =>
          runAction(async () => {
            if (isReacted) {
              await removeThreadReaction(thread.id);
              setIsReacted(false);
            } else {
              await reactToThread(thread.id);
              setIsReacted(true);
            }
          }, isReacted ? "已取消点赞。" : "已点赞。")
        }
      >
        {isReacted ? "已点赞" : "点赞"} · {thread.reactionCount}
      </button>
      <button
        className="toolbar-button"
        type="button"
        onClick={() =>
          runAction(async () => {
            if (isBookmarked) {
              await removeThreadBookmark(thread.id);
              setIsBookmarked(false);
            } else {
              await bookmarkThread(thread.id);
              setIsBookmarked(true);
            }
          }, isBookmarked ? "已取消收藏。" : "已收藏。")
        }
      >
        {isBookmarked ? "已收藏" : "收藏"} · {thread.bookmarkCount}
      </button>
      <button
        className="toolbar-button"
        type="button"
        onClick={() =>
          runAction(async () => {
            if (isFollowing) {
              await unfollowUser(thread.authorId);
              setIsFollowing(false);
            } else {
              await followUser(thread.authorId);
              setIsFollowing(true);
            }
          }, isFollowing ? "已取消关注作者。" : "已关注作者。")
        }
      >
        {isFollowing ? "已关注作者" : "关注作者"}
      </button>
      <button
        className="toolbar-button danger-button"
        type="button"
        onClick={() =>
          runAction(
            () =>
              createReport({
                targetType: "thread",
                targetId: thread.id,
                reason: ReportReason.Spam,
                detail: "前台详情页举报"
              }),
            "举报已提交。"
          )
        }
      >
        举报
      </button>
      {viewerId === thread.authorId ? <ThreadEditForm thread={thread} onSaved={() => router.refresh()} /> : null}
      {message ? <p className="form-help">{message}</p> : null}
    </div>
  );
}

function ThreadEditForm({ thread, onSaved }: { thread: ThreadDetail; onSaved: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    try {
      await updateThread(thread.id, {
        title: String(formData.get("title") ?? ""),
        body: String(formData.get("body") ?? ""),
        tags: String(formData.get("tags") ?? "")
          .split(/[,\s]+/)
          .map((tag) => tag.trim())
          .filter(Boolean)
      });
      setIsOpen(false);
      onSaved();
    } catch {
      setError("保存失败，请检查内容后重试。");
    }
  }

  if (!isOpen) {
    return (
      <button className="toolbar-button" type="button" onClick={() => setIsOpen(true)}>
        编辑
      </button>
    );
  }

  return (
    <form className="inline-edit-form" onSubmit={handleSubmit}>
      <label>
        标题
        <input name="title" defaultValue={thread.title} minLength={5} maxLength={120} required />
      </label>
      <label>
        正文
        <textarea name="body" defaultValue={thread.body} minLength={10} maxLength={20000} rows={5} required />
      </label>
      <label>
        标签
        <input name="tags" defaultValue={thread.tags.join(", ")} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="inline-actions">
        <button className="primary-action" type="submit">
          保存
        </button>
        <button className="toolbar-button" type="button" onClick={() => setIsOpen(false)}>
          取消
        </button>
      </div>
    </form>
  );
}
