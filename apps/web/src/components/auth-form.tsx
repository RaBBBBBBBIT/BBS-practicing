"use client";

import type { LoginInput, PublicUser, RegisterInput } from "@bbs/shared";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { loginUser, registerUser } from "../lib/forum-api";

export type AuthMode = "login" | "register";

export interface AuthFormValues {
  email: string;
  username?: string;
  password: string;
}

interface BaseSubmitAuthFormOptions {
  values: AuthFormValues;
  redirect: (href: string) => void;
}

export type SubmitAuthFormOptions =
  | (BaseSubmitAuthFormOptions & {
      mode: "login";
      action: (input: LoginInput) => Promise<PublicUser>;
    })
  | (BaseSubmitAuthFormOptions & {
      mode: "register";
      action: (input: RegisterInput) => Promise<PublicUser>;
    });

export async function submitAuthForm(options: SubmitAuthFormOptions): Promise<void> {
  if (options.mode === "register") {
    await options.action({
      email: options.values.email,
      username: options.values.username ?? "",
      password: options.values.password
    });
  } else {
    await options.action({
      email: options.values.email,
      password: options.values.password
    });
  }

  options.redirect("/threads/new");
}

export interface AuthFormProps {
  mode: AuthMode;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const values: AuthFormValues = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    };

    if (isRegister) {
      values.username = String(formData.get("username") ?? "");
    }

    try {
      if (isRegister) {
        await submitAuthForm({
          mode: "register",
          values,
          action: registerUser,
          redirect: (href) => router.push(href)
        });
      } else {
        await submitAuthForm({
          mode: "login",
          values,
          action: loginUser,
          redirect: (href) => router.push(href)
        });
      }
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <label>
        邮箱
        <input name="email" type="email" autoComplete="email" maxLength={120} required />
      </label>
      {isRegister ? (
        <label>
          用户名
          <input name="username" type="text" autoComplete="username" minLength={3} maxLength={32} required />
        </label>
      ) : null}
      <label>
        密码
        <input
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={8}
          maxLength={72}
          required
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-action" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "提交中..." : isRegister ? "注册并发帖" : "登录并发帖"}
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
