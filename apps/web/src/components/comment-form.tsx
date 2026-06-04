"use client";

import type { CommentSummary, CreateCommentInput, PublicUser } from "@bbs/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createComment, getCurrentUser } from "../lib/forum-api";

export type SubmitCommentFormResult =
  | {
      status: "created";
      comment: CommentSummary;
    }
  | {
      status: "unauthenticated";
      message: string;
    };

export interface SubmitCommentFormOptions {
  threadId: string;
  body: string;
  create: (threadId: string, input: CreateCommentInput) => Promise<CommentSummary>;
  refresh: () => void;
}

export async function submitCommentForm({
  threadId,
  body,
  create,
  refresh
}: SubmitCommentFormOptions): Promise<SubmitCommentFormResult> {
  try {
    const comment = await create(threadId, { body });
    refresh();
    return {
      status: "created",
      comment
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("status 401")) {
      return {
        status: "unauthenticated",
        message: "请先登录后再发表评论。"
      };
    }

    throw error;
  }
}

export interface CommentFormProps {
  threadId: string;
}

export function CommentForm({ threadId }: CommentFormProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((user) => {
        if (isMounted) {
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await submitCommentForm({
        threadId,
        body,
        create: createComment,
        refresh: () => router.refresh()
      });

      if (result.status === "created") {
        setBody("");
      } else {
        setError(result.message);
      }
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="comment-card signin-comment-box">
        <div className="comment-card-body">
          <p>登录后参与评论</p>
          <Link className="secondary-action" href="/login">
            登录后评论
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="comment-card comment-form-card" onSubmit={handleSubmit}>
      <header className="comment-card-header">
        <strong>{currentUser.username}</strong>
        <span>准备发表评论</span>
      </header>
      <div className="comment-card-body">
        <label>
          <span className="sr-only">评论内容</span>
          <textarea
            maxLength={5000}
            minLength={1}
            name="body"
            onChange={(event) => setBody(event.target.value)}
            placeholder="写下你的回复..."
            required
            rows={5}
            value={body}
          />
        </label>
        {error ? (
          <p className="form-error">
            {error}{" "}
            {error.includes("登录") ? (
              <Link href="/login">去登录</Link>
            ) : null}
          </p>
        ) : null}
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "发表中..." : "发表评论"}
        </button>
      </div>
    </form>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试。";
}
