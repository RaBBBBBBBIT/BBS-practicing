# Frontend BBS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable user-facing BBS workflow: visitors can browse boards, board-specific thread lists, and thread details; users can register or log in; authenticated users can create a thread and see it in the forum.

**Architecture:** Extend the Nest API just enough for real forum navigation, then build focused Next.js App Router pages. Server components load public board/thread data; client components handle auth and posting through browser `fetch` with `credentials: "include"` so the API-owned HttpOnly cookie works across localhost ports. Shared DTO types remain the cross-package contract.

**Tech Stack:** NestJS, Prisma, Next.js 16, React 19, TypeScript, Vitest, Supertest, `@bbs/shared`.

---

## Scope

Included:

- API support for public board-specific thread lists and thread detail lookup.
- Public board thread counts that only count published threads.
- Web API client helpers for boards, threads, auth, and thread creation.
- Next.js pages for home, board thread list, thread detail, login, register, and new thread.
- Client-side auth forms and thread creation form.
- Focused tests for API behavior, web API client behavior, and view-model helpers.
- Runtime verification against the local API and web app.

Deferred:

- Comments, search, pagination UI, profile pages, settings, admin UI workflows, Markdown editor, file uploads, optimistic updates, production deployment polish.

## File Structure

- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`
- Modify: `apps/api/src/boards/boards.service.ts`
- Modify: `apps/api/src/threads/threads.controller.ts`
- Modify: `apps/api/src/threads/threads.service.ts`
- Modify: `apps/api/test/boards.e2e-spec.ts`
- Modify: `apps/api/test/threads.e2e-spec.ts`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/lib/home-copy.ts`
- Modify: `apps/web/src/lib/home-copy.test.ts`
- Create: `apps/web/src/app/boards/[slug]/page.tsx`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/app/register/page.tsx`
- Create: `apps/web/src/app/threads/[id]/page.tsx`
- Create: `apps/web/src/app/threads/new/page.tsx`
- Create: `apps/web/src/components/auth-form.tsx`
- Create: `apps/web/src/components/thread-form.tsx`
- Create: `apps/web/src/lib/forum-api.ts`
- Create: `apps/web/src/lib/forum-api.test.ts`
- Create: `apps/web/src/lib/forum-view-model.ts`
- Create: `apps/web/src/lib/forum-view-model.test.ts`

## Task 1: API Thread Detail And Board Filtering

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`
- Modify: `apps/api/src/boards/boards.service.ts`
- Modify: `apps/api/src/threads/threads.controller.ts`
- Modify: `apps/api/src/threads/threads.service.ts`
- Modify: `apps/api/test/boards.e2e-spec.ts`
- Modify: `apps/api/test/threads.e2e-spec.ts`

- [ ] **Step 1: Write failing shared DTO tests**

Add tests for a new `ThreadDetail` type shape by checking exported compile-time fields through a simple fixture in `packages/shared/src/index.test.ts`. The fixture must include `id`, `boardId`, `boardSlug`, `boardName`, `authorId`, `authorUsername`, `title`, `body`, `status`, `tags`, `createdAt`, and `updatedAt`.

- [ ] **Step 2: Run shared tests and verify RED**

```bash
pnpm --filter @bbs/shared test
```

Expected: FAIL because `ThreadDetail` is not exported.

- [ ] **Step 3: Extend shared DTOs**

Add:

- `boardName: string` and `updatedAt: string` to `ThreadSummary`;
- `ThreadDetail` interface with full `body`;
- keep existing auth and board DTOs unchanged.

- [ ] **Step 4: Write failing API e2e tests**

Extend API e2e coverage:

- `GET /api/threads?boardSlug=threads-backend` returns only published threads in that board;
- `GET /api/threads/:id` returns a published thread detail with `body`, `boardName`, and `updatedAt`;
- `GET /api/threads/:id` returns `404` for hidden/deleted/draft or missing threads;
- `GET /api/boards` `threadCount` counts only published threads.

- [ ] **Step 5: Run API tests and verify RED**

```bash
pnpm --filter api test -- boards.e2e-spec.ts threads.e2e-spec.ts
```

Expected: FAIL because detail route, board filtering, public count filtering, and expanded DTO fields are not implemented.

- [ ] **Step 6: Implement API behavior**

Update services/controllers:

- `BoardsService.listBoards()` counts only `ThreadStatus.PUBLISHED`;
- `ThreadsController.listThreads(@Query("boardSlug") boardSlug?: string)`;
- `ThreadsController.getThread(@Param("id") id: string)`;
- `ThreadsService.listThreads({ boardSlug }?: { boardSlug?: string })`;
- `ThreadsService.getPublishedThread(id: string)`;
- all public thread reads filter to `PrismaThreadStatus.PUBLISHED`;
- thread summary/detail mapping includes `boardName` and `updatedAt`.

- [ ] **Step 7: Run API and shared validation**

```bash
pnpm --filter @bbs/shared test
pnpm --filter api test -- boards.e2e-spec.ts threads.e2e-spec.ts
pnpm --filter api typecheck
pnpm --filter api build
pnpm --filter api lint
```

Expected: all pass.

- [ ] **Step 8: Commit API support**

```bash
git add packages/shared apps/api
git commit -m "功能：补充主题浏览接口"
```

## Task 2: Web API Client And View Models

**Files:**
- Modify: `apps/web/src/lib/home-copy.ts`
- Modify: `apps/web/src/lib/home-copy.test.ts`
- Create: `apps/web/src/lib/forum-api.ts`
- Create: `apps/web/src/lib/forum-api.test.ts`
- Create: `apps/web/src/lib/forum-view-model.ts`
- Create: `apps/web/src/lib/forum-view-model.test.ts`

- [ ] **Step 1: Write failing web API client tests**

Create tests for:

- default API base URL is `http://localhost:4000/api`;
- trailing slashes are removed from custom base URL;
- `fetchBoards()` calls `GET /boards` with `credentials: "include"` and returns `boards`;
- `fetchThreads({ boardSlug })` calls `/threads?boardSlug=<slug>`;
- `fetchThread(id)` calls `/threads/:id`;
- `createThread()` posts JSON to `/threads` with `credentials: "include"` and returns `thread`;
- `getCurrentUser()` returns `null` on `401`;
- non-2xx responses throw an error that includes the status code.

- [ ] **Step 2: Run web API client tests and verify RED**

```bash
pnpm --filter web test -- forum-api.test.ts
```

Expected: FAIL because `forum-api.ts` does not exist.

- [ ] **Step 3: Implement web API client**

Implement helpers:

- `resolveApiBaseUrl(value?: string): string`
- `fetchBoards(fetcher?, baseUrl?): Promise<BoardSummary[]>`
- `fetchThreads(options?, fetcher?, baseUrl?): Promise<ThreadSummary[]>`
- `fetchThread(id, fetcher?, baseUrl?): Promise<ThreadDetail>`
- `getCurrentUser(fetcher?, baseUrl?): Promise<PublicUser | null>`
- `registerUser(input, fetcher?, baseUrl?): Promise<PublicUser>`
- `loginUser(input, fetcher?, baseUrl?): Promise<PublicUser>`
- `logoutUser(fetcher?, baseUrl?): Promise<void>`
- `createThread(input, fetcher?, baseUrl?): Promise<ThreadSummary>`

- [ ] **Step 4: Write failing view-model tests**

Cover:

- `getHomePageCopy()` labels the app as a real community screen rather than the old shell;
- `formatThreadDate()` formats ISO timestamps with Chinese locale date/time text;
- `getBoardOptions()` maps board summaries to `{ value, label }` and keeps order;
- `splitTags("nestjs, architecture  api")` returns `["nestjs", "architecture", "api"]`;
- `getThreadHref(thread)` returns `/threads/<id>`;
- `getBoardHref(board)` returns `/boards/<slug>`.

- [ ] **Step 5: Run view-model tests and verify RED**

```bash
pnpm --filter web test -- home-copy.test.ts forum-view-model.test.ts
```

Expected: FAIL because the view-model module does not exist and copy still uses shell text.

- [ ] **Step 6: Implement view model and copy**

Implement:

- `formatThreadDate(value: string): string`
- `getBoardOptions(boards: BoardSummary[]): Array<{ value: string; label: string }>`
- `splitTags(value: string): string[]`
- `getThreadHref(thread: ThreadSummary | ThreadDetail): string`
- `getBoardHref(board: BoardSummary): string`
- homepage copy for the BBS user frontend.

- [ ] **Step 7: Run web validation**

```bash
pnpm --filter web test -- forum-api.test.ts home-copy.test.ts forum-view-model.test.ts
pnpm --filter web typecheck
pnpm --filter web build
pnpm --filter web lint
```

Expected: all pass.

- [ ] **Step 8: Commit client and view model**

```bash
git add apps/web/src/lib
git commit -m "功能：新增前台论坛客户端"
```

## Task 3: Forum Pages And Forms

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/boards/[slug]/page.tsx`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/app/register/page.tsx`
- Create: `apps/web/src/app/threads/[id]/page.tsx`
- Create: `apps/web/src/app/threads/new/page.tsx`
- Create: `apps/web/src/components/auth-form.tsx`
- Create: `apps/web/src/components/thread-form.tsx`

- [ ] **Step 1: Implement public pages**

Create server pages:

- `/` loads boards and latest threads;
- `/boards/[slug]` loads boards and threads for the selected board slug;
- `/threads/[id]` loads thread detail and renders title, metadata, tags, and body;
- all pages render a stable API-unavailable message instead of crashing.

- [ ] **Step 2: Implement auth pages**

Create client form component `AuthForm` and pages:

- `/login` uses `loginUser()`;
- `/register` uses `registerUser()`;
- successful auth redirects to `/threads/new`;
- show server/API validation errors inline.

- [ ] **Step 3: Implement thread creation page**

Create `ThreadForm` and `/threads/new`:

- loads board options;
- uses `createThread()`;
- parses tags through `splitTags()`;
- redirects to the created thread detail page;
- handles unauthenticated `401` by linking to `/login`.

- [ ] **Step 4: Style forum UI**

Update `globals.css` with restrained, responsive styles:

- no marketing hero;
- no nested cards;
- clear board/sidebar, thread list, thread detail, auth, and posting areas;
- mobile-safe layout and button text.

- [ ] **Step 5: Run web validation**

```bash
pnpm --filter web test
pnpm --filter web typecheck
pnpm --filter web build
pnpm --filter web lint
```

Expected: all pass.

- [ ] **Step 6: Commit pages**

```bash
git add apps/web/src/app apps/web/src/components
git commit -m "功能：接入前台论坛页面"
```

## Task 4: Runtime And Full Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Start runtime dependencies**

```bash
docker compose up -d postgres redis minio
pnpm db:migrate
pnpm db:seed
pnpm dev:api
pnpm dev:web
```

- [ ] **Step 2: Verify API and web runtime**

Check:

- `curl http://localhost:4000/api/boards` returns seeded boards;
- `curl http://localhost:4000/api/threads` returns an array;
- `curl http://localhost:4000/api/threads/<id>` returns detail for a published thread;
- open `http://localhost:3000` in the in-app browser;
- verify first viewport renders a forum interface, not the old shell;
- verify board names from seed data are visible;
- navigate to a board page and a thread detail page;
- register or log in through the page;
- post a thread through `/threads/new`;
- verify the browser lands on the new thread detail page;
- take a desktop screenshot and a mobile screenshot for visual QA.

- [ ] **Step 3: Run full verification**

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm lint
docker compose config
```

Expected: all pass.

- [ ] **Step 4: Update README and stop services**

Update README with front-end runtime flow and useful URLs. Then stop services:

```bash
docker compose down
git status --short
```

Expected: services stopped and no uncommitted changes except intentional README updates.

- [ ] **Step 5: Commit runtime docs**

```bash
git add README.md
git commit -m "文档：补充前台运行验收说明"
```
