# Core BBS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable business slice of the technical BBS: database schema, user registration/login/session lookup, board listing, and thread creation/listing.

**Architecture:** The API owns persistence through Prisma and PostgreSQL. Shared DTOs and enums live in `packages/shared` so the API, user frontend, and admin frontend can use one contract. The first slice keeps auth simple and testable with HttpOnly cookie sessions, bcrypt password hashing, and NestJS modules for auth, boards, and threads.

**Tech Stack:** TypeScript, NestJS, Prisma, PostgreSQL, Vitest, Supertest, Zod, bcryptjs, cookie-parser.

---

## Scope

This plan implements the next foundation-to-MVP slice after `2026-06-03-project-foundation.md`.

Included:

- Prisma schema and migration-ready local database setup.
- Shared DTO schemas for auth, boards, and threads.
- API validation helper using shared schemas.
- Auth endpoints for register, login, logout, and current session.
- Board read endpoint with seed data.
- Thread creation and listing endpoints.
- README updates for database migration and business endpoints.

Deferred to later plans:

- Comments, nested replies, reactions, bookmarks, follows, notifications, private messages, reports, moderation workflows, uploads, full-text search, admin screens, and production deployment hardening.

## File Structure

Create or modify these files:

- Modify: `.env.example`
- Modify: `README.md`
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/test/health.e2e-spec.ts`
- Modify: `packages/shared/package.json`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/validation/zod-validation.pipe.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/current-user.decorator.ts`
- Create: `apps/api/src/auth/session.guard.ts`
- Create: `apps/api/src/boards/boards.controller.ts`
- Create: `apps/api/src/boards/boards.module.ts`
- Create: `apps/api/src/boards/boards.service.ts`
- Create: `apps/api/src/threads/threads.controller.ts`
- Create: `apps/api/src/threads/threads.module.ts`
- Create: `apps/api/src/threads/threads.service.ts`
- Create: `apps/api/test/auth.e2e-spec.ts`
- Create: `apps/api/test/boards.e2e-spec.ts`
- Create: `apps/api/test/threads.e2e-spec.ts`

## Task 1: Shared DTO Contracts

**Files:**
- Modify: `packages/shared/package.json`
- Modify: `packages/shared/src/index.test.ts`
- Modify: `packages/shared/src/index.ts`

- [x] **Step 1: Install shared schema dependency**

Run:

```bash
pnpm add --filter @bbs/shared zod
```

Expected: `packages/shared/package.json` has `zod` in `dependencies`, and `pnpm-lock.yaml` is updated.

- [x] **Step 2: Write failing shared DTO tests**

Replace `packages/shared/src/index.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import {
  BoardStatus,
  createHealthResponse,
  createThreadSchema,
  loginSchema,
  registerSchema,
  ThreadStatus,
  UserRole,
  UserStatus
} from "./index";

describe("shared domain constants", () => {
  it("exposes stable role and status values", () => {
    expect(UserRole.Admin).toBe("admin");
    expect(UserStatus.Muted).toBe("muted");
    expect(ThreadStatus.Published).toBe("published");
    expect(BoardStatus.Open).toBe("open");
  });
});

describe("createHealthResponse", () => {
  it("creates an API health payload with an ISO timestamp", () => {
    const response = createHealthResponse("api");

    expect(response.status).toBe("ok");
    expect(response.service).toBe("api");
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});

describe("auth schemas", () => {
  it("accepts a valid registration payload", () => {
    expect(
      registerSchema.parse({
        email: "alice@example.com",
        username: "alice",
        password: "password123"
      })
    ).toEqual({
      email: "alice@example.com",
      username: "alice",
      password: "password123"
    });
  });

  it("rejects short passwords", () => {
    expect(() =>
      registerSchema.parse({
        email: "alice@example.com",
        username: "alice",
        password: "short"
      })
    ).toThrow();
  });

  it("accepts a valid login payload", () => {
    expect(
      loginSchema.parse({
        email: "alice@example.com",
        password: "password123"
      })
    ).toEqual({
      email: "alice@example.com",
      password: "password123"
    });
  });
});

describe("thread schemas", () => {
  it("normalizes a valid thread creation payload", () => {
    expect(
      createThreadSchema.parse({
        boardId: "board_123",
        title: "How do I debug NestJS providers?",
        body: "I am trying to understand dependency injection.",
        tags: ["nestjs", "debugging"]
      })
    ).toEqual({
      boardId: "board_123",
      title: "How do I debug NestJS providers?",
      body: "I am trying to understand dependency injection.",
      tags: ["nestjs", "debugging"]
    });
  });
});
```

- [x] **Step 3: Run shared tests and verify they fail**

Run:

```bash
pnpm --filter @bbs/shared test
```

Expected: FAIL because `BoardStatus`, `registerSchema`, `loginSchema`, and `createThreadSchema` are not exported.

- [x] **Step 4: Implement shared DTOs and schemas**

Replace `packages/shared/src/index.ts` with:

```ts
import { z } from "zod";

export enum UserRole {
  Guest = "guest",
  User = "user",
  Moderator = "moderator",
  Admin = "admin"
}

export enum UserStatus {
  Active = "active",
  Muted = "muted",
  Banned = "banned"
}

export enum BoardStatus {
  Open = "open",
  Closed = "closed"
}

export enum ThreadStatus {
  Draft = "draft",
  Published = "published",
  Hidden = "hidden",
  Deleted = "deleted"
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export function createHealthResponse(service: string): HealthResponse {
  return {
    status: "ok",
    service,
    timestamp: new Date().toISOString()
  };
}

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  createdAt: z.string().datetime()
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const registerSchema = z.object({
  email: z.string().email().max(120),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(72)
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(72)
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthSessionResponse {
  user: PublicUser;
}

export interface BoardSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: BoardStatus;
  threadCount: number;
}

export const createThreadSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(5).max(120),
  body: z.string().min(10).max(20000),
  tags: z.array(z.string().min(1).max(24)).max(5).default([])
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export interface ThreadSummary {
  id: string;
  boardId: string;
  boardSlug: string;
  authorId: string;
  authorUsername: string;
  title: string;
  excerpt: string;
  status: ThreadStatus;
  tags: string[];
  createdAt: string;
}
```

- [x] **Step 5: Run shared tests and build**

Run:

```bash
pnpm --filter @bbs/shared test
pnpm --filter @bbs/shared build
```

Expected: tests pass and `packages/shared/dist/index.d.ts` includes the new exported DTOs.

- [x] **Step 6: Commit shared DTO contracts**

Run:

```bash
git add packages/shared package.json pnpm-lock.yaml
git commit -m "功能：新增共享业务 DTO"
```

Expected: commit contains shared DTO schema work only.

## Task 2: Prisma Schema And Seed

**Files:**
- Modify: `.env.example`
- Modify: `apps/api/package.json`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Modify: `apps/api/src/app.module.ts`

- [x] **Step 1: Install Prisma dependencies**

Run:

```bash
pnpm add --filter api @prisma/client
pnpm add -D --filter api prisma
```

Expected: `apps/api/package.json` and `pnpm-lock.yaml` are updated.

- [x] **Step 2: Create Prisma schema and seed**

Create `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String      @id @default(cuid())
  email        String      @unique
  username     String      @unique
  passwordHash String
  role         UserRole    @default(USER)
  status       UserStatus  @default(ACTIVE)
  sessions     Session[]
  threads      Thread[]
  comments     Comment[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Session {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Board {
  id          String      @id @default(cuid())
  slug        String      @unique
  name        String
  description String
  status      BoardStatus @default(OPEN)
  threads     Thread[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Thread {
  id        String       @id @default(cuid())
  boardId   String
  board     Board        @relation(fields: [boardId], references: [id])
  authorId  String
  author    User         @relation(fields: [authorId], references: [id])
  title     String
  body      String
  status    ThreadStatus @default(PUBLISHED)
  tags      String[]     @default([])
  comments  Comment[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model Comment {
  id        String   @id @default(cuid())
  threadId  String
  thread    Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  parentId  String?
  body      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  USER
  MODERATOR
  ADMIN
}

enum UserStatus {
  ACTIVE
  MUTED
  BANNED
}

enum BoardStatus {
  OPEN
  CLOSED
}

enum ThreadStatus {
  DRAFT
  PUBLISHED
  HIDDEN
  DELETED
}
```

Create `apps/api/prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const boards = [
  {
    slug: "frontend",
    name: "前端开发",
    description: "讨论 React、Next.js、CSS 和前端工程化。"
  },
  {
    slug: "backend",
    name: "后端开发",
    description: "讨论 NestJS、数据库、API 设计和服务端工程。"
  },
  {
    slug: "devops",
    name: "部署运维",
    description: "讨论 Docker、CI/CD、服务器和可观测性。"
  }
];

async function main() {
  for (const board of boards) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: board,
      create: board
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [x] **Step 3: Update API package scripts**

Update `apps/api/package.json` scripts to include:

```json
{
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "tsx prisma/seed.ts"
}
```

Also add:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [x] **Step 4: Update environment example**

Ensure `.env.example` contains:

```env
DATABASE_URL=postgresql://bbs:bbs_password@localhost:5432/bbs_dev
SESSION_COOKIE_NAME=bbs_session
SESSION_SECRET=change_me_to_a_long_random_secret
```

- [x] **Step 5: Add Prisma service**

Create `apps/api/src/prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Create `apps/api/src/prisma/prisma.module.ts`:

```ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}
```

Update `apps/api/src/app.module.ts`:

```ts
import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [PrismaModule, HealthModule]
})
export class AppModule {}
```

- [x] **Step 6: Generate Prisma client and verify schema**

Run:

```bash
pnpm --filter api prisma:generate
pnpm --filter api typecheck
```

Expected: Prisma client generation succeeds and API typecheck passes.

- [x] **Step 7: Commit Prisma foundation**

Run:

```bash
git add .env.example apps/api package.json pnpm-lock.yaml
git commit -m "功能：新增数据库模型基础"
```

Expected: commit contains Prisma schema, seed, service, and dependency changes.

## Task 3: Auth API

**Files:**
- Create: `apps/api/src/validation/zod-validation.pipe.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/current-user.decorator.ts`
- Create: `apps/api/src/auth/session.guard.ts`
- Create: `apps/api/test/auth.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/package.json`

- [x] **Step 1: Install auth dependencies**

Run:

```bash
pnpm add --filter api bcryptjs cookie-parser
pnpm add -D --filter api @types/cookie-parser
```

Expected: API package and lockfile include bcryptjs and cookie-parser.

- [x] **Step 2: Write failing auth e2e tests**

Create `apps/api/test/auth.e2e-spec.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("auth API", () => {
  it("registers a user and returns the current session", async () => {
    expect(true).toBe(false);
  });
});
```

Run:

```bash
pnpm --filter api test -- auth.e2e-spec.ts
```

Expected: FAIL because the placeholder assertion fails. Replace this placeholder with full Supertest coverage before implementation:

```ts
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("auth API", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it("registers a user and returns the current session", async () => {
    const agent = request.agent(app.getHttpServer());

    const registerResponse = await agent
      .post("/api/auth/register")
      .send({
        email: "alice@example.com",
        username: "alice",
        password: "password123"
      })
      .expect(201);

    expect(registerResponse.body.user.email).toBe("alice@example.com");
    expect(registerResponse.headers["set-cookie"]?.join(";")).toContain("bbs_session=");

    const meResponse = await agent.get("/api/auth/me").expect(200);
    expect(meResponse.body.user.username).toBe("alice");
  });

  it("logs in an existing user and logs out", async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post("/api/auth/register").send({
      email: "bob@example.com",
      username: "bob",
      password: "password123"
    });
    await agent.post("/api/auth/logout").expect(204);

    await agent
      .post("/api/auth/login")
      .send({
        email: "bob@example.com",
        password: "password123"
      })
      .expect(200);

    await agent.get("/api/auth/me").expect(200);
    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/auth/me").expect(401);
  });
});
```

- [x] **Step 3: Run auth tests and verify they fail for missing module**

Run:

```bash
pnpm --filter api test -- auth.e2e-spec.ts
```

Expected: FAIL because `/api/auth/register` is not implemented.

- [x] **Step 4: Implement validation pipe and auth module**

Implement `apps/api/src/validation/zod-validation.pipe.ts`, auth service, controller, guard, and decorator using shared schemas, bcryptjs hashing, random session tokens, SHA-256 token hashes, and HttpOnly cookie `bbs_session`.

Required endpoint behavior:

- `POST /api/auth/register` creates active user with role `user`, sets cookie, returns `{ user }`.
- `POST /api/auth/login` verifies email/password, sets cookie, returns `{ user }`.
- `GET /api/auth/me` returns `{ user }` for valid cookie, otherwise 401.
- `POST /api/auth/logout` deletes the current session if present, clears cookie, returns 204.

- [x] **Step 5: Run auth tests**

Run:

```bash
pnpm --filter api test -- auth.e2e-spec.ts
pnpm --filter api typecheck
```

Expected: auth e2e tests and API typecheck pass.

- [x] **Step 6: Commit auth API**

Run:

```bash
git add apps/api package.json pnpm-lock.yaml
git commit -m "功能：新增用户认证接口"
```

Expected: commit contains auth module and tests.

## Task 4: Boards And Threads API

**Files:**
- Create: `apps/api/src/boards/boards.controller.ts`
- Create: `apps/api/src/boards/boards.module.ts`
- Create: `apps/api/src/boards/boards.service.ts`
- Create: `apps/api/src/threads/threads.controller.ts`
- Create: `apps/api/src/threads/threads.module.ts`
- Create: `apps/api/src/threads/threads.service.ts`
- Create: `apps/api/test/boards.e2e-spec.ts`
- Create: `apps/api/test/threads.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [x] **Step 1: Write failing boards and threads tests**

Create e2e tests that verify:

- `GET /api/boards` returns seeded boards with `threadCount`.
- `GET /api/threads` returns published threads.
- `POST /api/threads` requires authentication.
- Authenticated user can create a thread in an open board.

- [x] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter api test -- boards.e2e-spec.ts threads.e2e-spec.ts
```

Expected: FAIL because boards and threads modules are missing.

- [x] **Step 3: Implement boards module**

Implement:

- `BoardsService.listBoards()` returns board summaries sorted by name.
- `BoardsController.getBoards()` exposes `GET /api/boards`.

- [x] **Step 4: Implement threads module**

Implement:

- `ThreadsService.listThreads()` returns published thread summaries sorted by newest first.
- `ThreadsService.createThread()` validates board exists and is open, then creates thread for current user.
- `ThreadsController.getThreads()` exposes `GET /api/threads`.
- `ThreadsController.createThread()` exposes authenticated `POST /api/threads`.

- [x] **Step 5: Run boards and threads tests**

Run:

```bash
pnpm --filter api test -- boards.e2e-spec.ts threads.e2e-spec.ts
pnpm --filter api typecheck
```

Expected: tests and typecheck pass.

- [x] **Step 6: Commit boards and threads API**

Run:

```bash
git add apps/api package.json pnpm-lock.yaml
git commit -m "功能：新增分区和主题接口"
```

Expected: commit contains boards and threads modules and tests.

## Task 5: MVP Verification And Docs

**Files:**
- Modify: `README.md`

- [x] **Step 1: Update README**

Add sections for:

- `pnpm db:migrate`
- `pnpm db:seed`
- Auth endpoints.
- Board and thread endpoints.

- [x] **Step 2: Run full verification**

Run:

```bash
pnpm install --frozen-lockfile
pnpm --filter api prisma:generate
pnpm test
pnpm typecheck
pnpm build
pnpm lint
docker compose config
```

Expected: all commands pass.

- [x] **Step 3: Run runtime verification**

Run:

```bash
docker compose up -d postgres redis minio
pnpm db:migrate
pnpm db:seed
pnpm dev
```

In another terminal, run:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/boards
curl http://localhost:4000/api/threads
```

Expected: health returns `status: ok`, boards returns seeded boards, threads returns an array.

- [x] **Step 4: Stop services and commit docs**

Run:

```bash
docker compose down
git add README.md pnpm-lock.yaml
git commit -m "文档：补充业务接口开发说明"
```

Expected: final MVP docs commit is created.
