"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { sendMessage } from "../lib/forum-api";

export function MessageComposer({ recipientId }: { recipientId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await sendMessage({ recipientId, body });
      setBody("");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error && error.message.includes("status 401") ? "请先登录后再发送私信。" : "私信发送失败。");
    }
  }

  return (
    <form className="message-composer" onSubmit={handleSubmit}>
      <label>
        <span className="sr-only">私信内容</span>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} minLength={1} maxLength={5000} rows={4} required />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-action" type="submit">
        发送私信
      </button>
    </form>
  );
}
