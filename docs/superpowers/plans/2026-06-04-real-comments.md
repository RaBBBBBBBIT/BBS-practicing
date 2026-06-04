# Real Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current demo-only discussion replies with real database-backed comments that can be read on thread detail pages and created by authenticated users.

**Architecture:** Reuse the existing Prisma `Comment` model and extend the shared DTO contract so comments travel through `ThreadDetail`. The Nest threads module will own top-level comment reads and writes under `/api/threads/:id`, while the Next.js detail page will render `thread.comments` and use a focused client component for authenticated comment submission.

**Tech Stack:** NestJS, Prisma, Next.js 16, React 19, TypeScript, Vitest, Supertest, Zod, `@bbs/shared`.

---

## Scope

Included:

- Shared `CommentSummary`, `CreateCommentInput`, and `createCommentSchema`.
- `ThreadDetail.comments` returned by `GET /api/threads/:id`.
- `POST /api/threads/:id/comments` for authenticated top-level comments.
- Web API client helper `createComment()`.
- Thread detail page rendering real comments instead of demo comments.
- Client comment composer with unauthenticated and authenticated states.
- README update documenting current real features and remaining UI placeholders.

Not included:

- Nested replies using `parentId`.
- Comment edit/delete/moderation.
- Subscribe, edit thread, search, filter, members page, labels page.
- Full Markdown parser, upload support, realtime updates, pagination.

## File Structure

- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`
- Modify: `apps/api/src/threads/threads.controller.ts`
- Modify: `apps/api/src/threads/threads.service.ts`
- Modify: `apps/api/test/threads.e2e-spec.ts`
- Modify: `apps/web/src/lib/forum-api.ts`
- Modify: `apps/web/src/lib/forum-api.test.ts`
- Modify: `apps/web/src/app/threads/[id]/page.tsx`
- Modify: `apps/web/src/app/threads/[id]/page.test.tsx`
- Create: `apps/web/src/components/comment-form.tsx`
- Create: `apps/web/src/components/comment-form.test.tsx`
- Modify: `README.md`

## Task 1: Shared Comment DTOs

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`

- [ ] **Step 1: Write failing shared tests**

Add tests to `packages/shared/src/index.test.ts`:

```ts
import { ThreadStatus, createCommentSchema, type CommentSummary, type ThreadDetail } from "./index";

it("validates comment creation input", () => {
  expect(createCommentSchema.parse({ body: "这是一条评论" })).toEqual({ body: "这是一条评论" });
  expect(() => createCommentSchema.parse({ body: "" })).toThrow();
  expect(() => createCommentSchema.parse({ body: "a".repeat(5001) })).toThrow();
});

it("describes thread details with comments", () => {
  const comment: CommentSummary = {
    id: "comment_1",
    threadId: "thread_1",
    authorId: "user_1",
    authorUsername: "alice_demo",
    parentId: null,
    body: "真实评论",
    createdAt: "2026-06-04T00:00:00.000Z",
    updatedAt: "2026-06-04T00:00:00.000Z"
  };

  const detail: ThreadDetail = {
    id: "thread_1",
    boardId: "board_1",
    boardSlug: "devops",
    boardName: "部署运维",
    authorId: "user_1",
    authorUsername: "alice_demo",
    title: "Docker Compose 依赖服务启动清单",
    body: "正文",
    status: ThreadStatus.Published,
    tags: ["docker"],
    comments: [comment],
    createdAt: "2026-06-04T00:00:00.000Z",
    updatedAt: "2026-06-04T00:00:00.000Z"
  };

  expect(detail.comments[0]?.body).toBe("真实评论");
});
```

- [ ] **Step 2: Run shared tests and verify RED**

```bash
pnpm --filter @bbs/shared test
```

Expected: FAIL because `createCommentSchema` and `CommentSummary` are not exported, and `ThreadDetail` does not contain `comments`.

- [ ] **Step 3: Implement shared DTOs**

Add to `packages/shared/src/index.ts`:

```ts
export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000)
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export interface CommentSummary {
  id: string;
  threadId: string;
  authorId: string;
  authorUsername: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadDetail extends Omit<ThreadSummary, "excerpt"> {
  body: string;
  comments: CommentSummary[];
}
```

- [ ] **Step 4: Run shared tests and commit**

```bash
pnpm --filter @bbs/shared test
pnpm --filter @bbs/shared build
git add packages/shared/src/index.ts packages/shared/src/index.test.ts
git commit -m "功能：新增评论共享类型"
```

Expected: tests and build pass.

## Task 2: API Comment Read And Create

**Files:**
- Modify: `apps/api/src/threads/threads.controller.ts`
- Modify: `apps/api/src/threads/threads.service.ts`
- Modify: `apps/api/test/threads.e2e-spec.ts`

- [ ] **Step 1: Write failing API e2e tests**

Add cases to `apps/api/test/threads.e2e-spec.ts`:

```ts
it("returns top-level comments on thread detail", async () => {
  await prisma.comment.create({
    data: {
      id: "comment_detail_1",
      threadId: publishedThread.id,
      authorId: author.id,
      body: "第一条真实评论"
    }
  });

  const response = await request(app.getHttpServer()).get(`/api/threads/${publishedThread.id}`).expect(200);

  expect(response.body.thread.comments).toEqual([
    expect.objectContaining({
      id: "comment_detail_1",
      authorUsername: author.username,
      parentId: null,
      body: "第一条真实评论"
    })
  ]);
});

it("creates a comment for an authenticated user", async () => {
  const agent = request.agent(app.getHttpServer());
  await agent.post("/api/auth/login").send({ email: author.email, password: "Password123!" }).expect(200);

  const response = await agent
    .post(`/api/threads/${publishedThread.id}/comments`)
    .send({ body: "通过 API 新增评论" })
    .expect(201);

  expect(response.body.comment).toMatchObject({
    threadId: publishedThread.id,
    authorUsername: author.username,
    parentId: null,
    body: "通过 API 新增评论"
  });
});

it("requires authentication to create comments", async () => {
  await request(app.getHttpServer()).post(`/api/threads/${publishedThread.id}/comments`).send({ body: "未登录评论" }).expect(401);
});

it("returns 404 when commenting on a missing thread", async () => {
  const agent = request.agent(app.getHttpServer());
  await agent.post("/api/auth/login").send({ email: author.email, password: "Password123!" }).expect(200);

  await agent.post("/api/threads/missing/comments").send({ body: "找不到主题" }).expect(404);
});
```

- [ ] **Step 2: Run API tests and verify RED**

```bash
pnpm --filter api test -- threads.e2e-spec.ts
```

Expected: FAIL because `ThreadDetail.comments` and `POST /api/threads/:id/comments` do not exist.

- [ ] **Step 3: Implement controller route**

Update `apps/api/src/threads/threads.controller.ts`:

```ts
import {
  createCommentSchema,
  createThreadSchema,
  type CommentSummary,
  type CreateCommentInput,
  type CreateThreadInput,
  type PublicUser,
  type ThreadDetail,
  type ThreadSummary
} from "@bbs/shared";

interface CommentResponse {
  comment: CommentSummary;
}

@Post(":id/comments")
@UseGuards(SessionGuard)
async createComment(
  @Param("id") id: string,
  @Body(new ZodValidationPipe(createCommentSchema)) input: CreateCommentInput,
  @CurrentUser() user: PublicUser
): Promise<CommentResponse> {
  return {
    comment: await this.threadsService.createComment(id, input, user)
  };
}
```

- [ ] **Step 4: Implement service mapping and persistence**

Update `apps/api/src/threads/threads.service.ts`:

```ts
import {
  ThreadStatus,
  type CommentSummary,
  type CreateCommentInput,
  type CreateThreadInput,
  type PublicUser,
  type ThreadDetail,
  type ThreadSummary
} from "@bbs/shared";

async createComment(threadId: string, input: CreateCommentInput, author: PublicUser): Promise<CommentSummary> {
  const thread = await this.prisma.thread.findFirst({
    where: { id: threadId, status: PrismaThreadStatus.PUBLISHED }
  });

  if (!thread) {
    throw new NotFoundException("Thread not found");
  }

  const comment = await this.prisma.comment.create({
    data: {
      threadId,
      authorId: author.id,
      body: input.body
    },
    include: { author: true }
  });

  await this.prisma.thread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() }
  });

  return this.toCommentSummary(comment);
}
```

Extend `getPublishedThread()` include:

```ts
include: {
  board: true,
  author: true,
  comments: {
    where: { parentId: null },
    orderBy: { createdAt: "asc" },
    include: { author: true }
  }
}
```

Add mapper:

```ts
private toCommentSummary(comment: {
  id: string;
  threadId: string;
  authorId: string;
  author: { username: string };
  parentId: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}): CommentSummary {
  return {
    id: comment.id,
    threadId: comment.threadId,
    authorId: comment.authorId,
    authorUsername: comment.author.username,
    parentId: comment.parentId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString()
  };
}
```

- [ ] **Step 5: Run API validation and commit**

```bash
pnpm --filter api test -- threads.e2e-spec.ts
pnpm --filter api typecheck
pnpm --filter api build
pnpm --filter api lint
git add apps/api/src/threads apps/api/test/threads.e2e-spec.ts
git commit -m "功能：新增主题评论接口"
```

Expected: all commands pass.

## Task 3: Web API Client Comment Helper

**Files:**
- Modify: `apps/web/src/lib/forum-api.ts`
- Modify: `apps/web/src/lib/forum-api.test.ts`

- [ ] **Step 1: Write failing web API client tests**

Add to `apps/web/src/lib/forum-api.test.ts`:

```ts
import { createComment } from "./forum-api";

it("creates a comment with browser credentials", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    jsonResponse({
      comment: {
        id: "comment_1",
        threadId: "thread_1",
        authorId: "user_1",
        authorUsername: "alice_demo",
        parentId: null,
        body: "真实评论",
        createdAt: "2026-06-04T00:00:00.000Z",
        updatedAt: "2026-06-04T00:00:00.000Z"
      }
    })
  );

  await expect(createComment("thread_1", { body: "真实评论" }, fetcher)).resolves.toMatchObject({
    id: "comment_1",
    body: "真实评论"
  });

  expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/api/threads/thread_1/comments", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body: "真实评论" })
  });
});
```

- [ ] **Step 2: Run web client tests and verify RED**

```bash
pnpm --filter web test -- forum-api.test.ts
```

Expected: FAIL because `createComment()` is not exported.

- [ ] **Step 3: Implement `createComment()`**

Update `apps/web/src/lib/forum-api.ts`:

```ts
import type { CommentSummary, CreateCommentInput } from "@bbs/shared";

interface CommentResponse {
  comment: CommentSummary;
}

export async function createComment(
  threadId: string,
  input: CreateCommentInput,
  fetcher: ForumFetch = defaultFetch,
  baseUrl?: string
): Promise<CommentSummary> {
  const response = await requestJson<CommentResponse>(`/threads/${encodeURIComponent(threadId)}/comments`, {
    fetcher,
    baseUrl,
    method: "POST",
    body: input
  });
  return response.comment;
}
```

- [ ] **Step 4: Run web client validation and commit**

```bash
pnpm --filter web test -- forum-api.test.ts
pnpm --filter web typecheck
git add apps/web/src/lib/forum-api.ts apps/web/src/lib/forum-api.test.ts
git commit -m "功能：新增前台评论客户端"
```

Expected: tests and typecheck pass.

## Task 4: Thread Detail Real Comment UI

**Files:**
- Modify: `apps/web/src/app/threads/[id]/page.tsx`
- Modify: `apps/web/src/app/threads/[id]/page.test.tsx`
- Create: `apps/web/src/components/comment-form.tsx`
- Create: `apps/web/src/components/comment-form.test.tsx`

- [ ] **Step 1: Write failing page test**

Update `apps/web/src/app/threads/[id]/page.test.tsx` fixture so `thread` includes:

```ts
comments: [
  {
    id: "comment_1",
    threadId: "thread_1",
    authorId: "user_2",
    authorUsername: "bob_demo",
    parentId: null,
    body: "数据库里的真实评论",
    createdAt: "2026-06-03T10:15:00.000Z",
    updatedAt: "2026-06-03T10:15:00.000Z"
  }
]
```

Replace demo assertions with:

```ts
expect(html).toContain("数据库里的真实评论");
expect(html).toContain("bob_demo");
expect(html).not.toContain("演示回复用于呈现讨论流");
expect(html).not.toContain("maintainer_demo");
expect(html).not.toContain("ops_demo");
```

- [ ] **Step 2: Run page test and verify RED**

```bash
pnpm --filter web test -- 'src/app/threads/[id]/page.test.tsx'
```

Expected: FAIL because the page still renders demo comments.

- [ ] **Step 3: Write failing comment form tests**

Create `apps/web/src/components/comment-form.test.tsx` with tests for exported pure helper `submitCommentForm()`:

```ts
import { describe, expect, it, vi } from "vitest";
import { submitCommentForm } from "./comment-form";

describe("submitCommentForm", () => {
  it("creates a comment and refreshes the page", async () => {
    const create = vi.fn().mockResolvedValue({ id: "comment_1" });
    const refresh = vi.fn();

    await expect(
      submitCommentForm({
        threadId: "thread_1",
        body: "真实评论",
        create,
        refresh
      })
    ).resolves.toEqual({ status: "created" });

    expect(create).toHaveBeenCalledWith("thread_1", { body: "真实评论" });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("returns unauthenticated state for 401 errors", async () => {
    const create = vi.fn().mockRejectedValue(new Error("API request failed with status 401"));

    await expect(
      submitCommentForm({
        threadId: "thread_1",
        body: "真实评论",
        create,
        refresh: vi.fn()
      })
    ).resolves.toEqual({
      status: "unauthenticated",
      message: "请先登录后再发表评论。"
    });
  });
});
```

- [ ] **Step 4: Run comment form tests and verify RED**

```bash
pnpm --filter web test -- comment-form.test.tsx
```

Expected: FAIL because `comment-form.tsx` does not exist.

- [ ] **Step 5: Implement real detail rendering**

In `apps/web/src/app/threads/[id]/page.tsx`:

- remove `getDemoComments()`, `DemoComment`, `addHours()`;
- compute `const comments = thread.comments`;
- compute participants from real comments:

```ts
function getParticipants(thread: ThreadDetail): string[] {
  return Array.from(new Set([thread.authorUsername, ...thread.comments.map((comment) => comment.authorUsername)]));
}
```

- render:

```tsx
{thread.comments.length > 0 ? (
  thread.comments.map((comment) => (
    <CommentCard
      authorUsername={comment.authorUsername}
      body={comment.body}
      createdAt={comment.createdAt}
      key={comment.id}
      marker="评论于"
    />
  ))
) : (
  <div className="empty-state discussion-empty">
    <h3>还没有评论</h3>
    <p>登录后可以成为第一个回复的人。</p>
  </div>
)}
<CommentForm threadId={thread.id} />
```

- [ ] **Step 6: Implement `CommentForm` client component**

Create `apps/web/src/components/comment-form.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { CommentSummary, CreateCommentInput, PublicUser } from "@bbs/shared";
import { createComment, getCurrentUser } from "../lib/forum-api";

export type SubmitCommentFormResult =
  | { status: "created" }
  | { status: "unauthenticated"; message: string };

export async function submitCommentForm({
  body,
  create,
  refresh,
  threadId
}: {
  threadId: string;
  body: string;
  create: (threadId: string, input: CreateCommentInput) => Promise<CommentSummary>;
  refresh: () => void;
}): Promise<SubmitCommentFormResult> {
  try {
    await create(threadId, { body });
    refresh();
    return { status: "created" };
  } catch (error) {
    if (error instanceof Error && error.message.includes("status 401")) {
      return { status: "unauthenticated", message: "请先登录后再发表评论。" };
    }
    throw error;
  }
}

export function CommentForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentUser()
      .then(setCurrentUser)
      .finally(() => setIsCheckingSession(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const body = String(formData.get("body") ?? "").trim();

    try {
      const result = await submitCommentForm({
        threadId,
        body,
        create: createComment,
        refresh: () => router.refresh()
      });

      if (result.status === "unauthenticated") {
        setError(result.message);
      } else {
        event.currentTarget.reset();
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "评论提交失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession || !currentUser) {
    return (
      <section className="timeline-item comment-composer" aria-label="回复讨论">
        <span className="timeline-avatar" aria-label="访客" title="访客">
          访
        </span>
        <div className="comment-card signin-comment-box">
          <div className="comment-card-body">
            <p>登录后参与评论</p>
            <Link className="secondary-action" href="/login">
              登录后评论
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="timeline-item comment-composer" aria-label="回复讨论">
      <span className="timeline-avatar" aria-label={currentUser.username} title={currentUser.username}>
        {currentUser.username.slice(0, 1).toUpperCase()}
      </span>
      <form className="comment-card comment-form" onSubmit={handleSubmit}>
        <div className="comment-card-body">
          <label>
            <span className="sr-only">发表评论</span>
            <textarea name="body" minLength={1} maxLength={5000} rows={5} required />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "发表中..." : "发表评论"}
          </button>
        </div>
      </form>
    </section>
  );
}
```

- [ ] **Step 7: Run web validation and commit**

```bash
pnpm --filter web test -- 'src/app/threads/[id]/page.test.tsx' comment-form.test.tsx
pnpm --filter web typecheck
pnpm --filter web build
pnpm --filter web lint
git add apps/web/src/app/threads/[id] apps/web/src/components/comment-form.tsx apps/web/src/components/comment-form.test.tsx apps/web/src/lib/forum-api.ts apps/web/src/lib/forum-api.test.ts
git commit -m "功能：接入真实评论前台"
```

Expected: all commands pass.

## Task 5: Documentation And Runtime Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README current feature boundary**

Add a section under `## 当前状态`:

```md
## 当前功能边界

已接入真实数据和接口的功能：

- 用户注册、登录、读取当前用户和退出登录 API。
- 分区列表、主题列表、主题详情和登录后发帖。
- 主题详情评论读取和登录后发表评论。

仍属于 UI 占位或后续扩展的功能：

- 顶栏搜索、首页筛选、标签点击筛选。
- 主题编辑、订阅、状态流转。
- 评论编辑、删除、楼中楼、审核、举报。
- 成员页、标签页、用户资料页、后台管理。
```

- [ ] **Step 2: Run full validation**

```bash
pnpm --filter @bbs/shared test
pnpm --filter api test
pnpm --filter web test
pnpm --filter api typecheck
pnpm --filter web typecheck
pnpm --filter api build
pnpm --filter web build
pnpm --filter api lint
pnpm --filter web lint
git diff --check
```

Expected: all commands pass.

- [ ] **Step 3: Runtime verification**

Start services:

```bash
docker compose up -d postgres redis minio
pnpm dev:api
pnpm dev:web
```

Verify manually:

- open `http://127.0.0.1:3000/threads/demo_thread_devops_compose`;
- confirm SQL demo comments appear in the timeline;
- log in with `alice@example.com` and `DemoPass123!`;
- submit a new comment;
- confirm the comment persists after page refresh.

- [ ] **Step 4: Commit docs and final README update**

```bash
git add README.md
git commit -m "文档：补充真实评论功能说明"
```

Expected: README clearly separates real features from placeholders.

## Self-Review Checklist

- The scope is one independent phase: real top-level comments.
- The plan does not include search, subscribe, edit, moderation, notifications, uploads, or admin features.
- Every task has explicit files, commands, and expected outcomes.
- Tests are written before implementation in each code task.
- Existing `Comment` schema is reused, so no migration is required.
- Runtime verification uses the existing demo thread and demo account.
