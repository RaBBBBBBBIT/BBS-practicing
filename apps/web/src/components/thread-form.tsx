"use client";

import type { BoardSummary, CreateThreadInput, ThreadSummary } from "@bbs/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createThread } from "../lib/forum-api";
import { getBoardOptions, getThreadHref, splitTags } from "../lib/forum-view-model";

export interface ThreadFormValues {
  boardId: string;
  title: string;
  body: string;
  tagsText: string;
}

export type SubmitThreadFormResult =
  | {
      status: "created";
      thread: ThreadSummary;
    }
  | {
      status: "unauthenticated";
      message: string;
    };

export interface SubmitThreadFormOptions {
  values: ThreadFormValues;
  create: (input: CreateThreadInput) => Promise<ThreadSummary>;
  redirect: (href: string) => void;
}

export async function submitThreadForm({
  values,
  create,
  redirect
}: SubmitThreadFormOptions): Promise<SubmitThreadFormResult> {
  try {
    const thread = await create({
      boardId: values.boardId,
      title: values.title,
      body: values.body,
      tags: splitTags(values.tagsText)
    });

    redirect(getThreadHref(thread));
    return {
      status: "created",
      thread
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("status 401")) {
      return {
        status: "unauthenticated",
        message: "请先登录后再发布主题。"
      };
    }

    throw error;
  }
}

export interface ThreadFormProps {
  boards: BoardSummary[];
}

export function ThreadForm({ boards }: ThreadFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const boardOptions = getBoardOptions(boards);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsUnauthenticated(false);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await submitThreadForm({
        values: {
          boardId: String(formData.get("boardId") ?? ""),
          title: String(formData.get("title") ?? ""),
          body: String(formData.get("body") ?? ""),
          tagsText: String(formData.get("tags") ?? "")
        },
        create: createThread,
        redirect: (href) => router.push(href)
      });

      if (result.status === "unauthenticated") {
        setIsUnauthenticated(true);
        setError(result.message);
      }
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (boardOptions.length === 0) {
    return <p className="empty-state">暂无可发布的分区。</p>;
  }

  return (
    <form className="form-panel thread-form" onSubmit={handleSubmit}>
      <label>
        分区
        <select name="boardId" defaultValue={boardOptions[0]?.value} required>
          {boardOptions.map((board) => (
            <option key={board.value} value={board.value}>
              {board.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        标题
        <input name="title" type="text" minLength={5} maxLength={120} required />
      </label>
      <label>
        正文
        <textarea name="body" minLength={10} maxLength={20000} rows={10} required />
      </label>
      <label>
        标签
        <input name="tags" type="text" placeholder="nestjs, api" />
      </label>
      {error ? (
        <p className="form-error">
          {error}
          {isUnauthenticated ? (
            <>
              {" "}
              <Link href="/login">去登录</Link>
            </>
          ) : null}
        </p>
      ) : null}
      <button className="primary-action" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "发布中..." : "发布主题"}
      </button>
    </form>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试。";
}
