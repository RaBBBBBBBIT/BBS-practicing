import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { BoardStatus as PrismaBoardStatus, ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("threads API", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    process.env.DATABASE_URL ??= "postgresql://bbs:bbs_password@localhost:5432/bbs_dev";
    process.env.SESSION_COOKIE_NAME ??= "bbs_session";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.session.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.thread.deleteMany();
    await prisma.user.deleteMany();
    await prisma.board.deleteMany();
    await prisma.board.create({
      data: {
        id: "board_threads_backend",
        slug: "threads-backend",
        name: "后端开发",
        description: "讨论 NestJS、数据库、API 设计和服务端工程。"
      }
    });
    await prisma.board.create({
      data: {
        id: "board_threads_frontend",
        slug: "threads-frontend",
        name: "前端开发",
        description: "讨论 React、Next.js、CSS 和前端工程化。"
      }
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("requires authentication to create a thread", async () => {
    await request(app.getHttpServer())
      .post("/api/threads")
      .send({
        boardId: "board_threads_backend",
        title: "How do I structure a NestJS module?",
        body: "I want to understand how providers and modules fit together.",
        tags: ["nestjs"]
      })
      .expect(401);
  });

  it("creates and lists published threads", async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post("/api/auth/register").send({
      email: "carol@example.com",
      username: "carol",
      password: "password123"
    });

    const createResponse = await agent
      .post("/api/threads")
      .send({
        boardId: "board_threads_backend",
        title: "How do I structure a NestJS module?",
        body: "I want to understand how providers and modules fit together.",
        tags: ["nestjs", "architecture"]
      })
      .expect(201);

    expect(createResponse.body.thread).toEqual(
      expect.objectContaining({
        boardId: "board_threads_backend",
        boardSlug: "threads-backend",
        boardName: "后端开发",
        authorUsername: "carol",
        title: "How do I structure a NestJS module?",
        excerpt: "I want to understand how providers and modules fit together.",
        status: "published",
        tags: ["nestjs", "architecture"]
      })
    );

    const listResponse = await request(app.getHttpServer()).get("/api/threads").expect(200);

    expect(listResponse.body.threads).toHaveLength(1);
    expect(listResponse.body.threads[0].title).toBe("How do I structure a NestJS module?");
    expect(listResponse.body.threads[0].updatedAt).toEqual(expect.any(String));
  });

  it("lists published threads only", async () => {
    await prisma.user.create({
      data: {
        id: "user_threads_author",
        email: "author@example.com",
        username: "author",
        passwordHash: "not-used-in-this-test"
      }
    });
    await prisma.thread.createMany({
      data: [
        {
          boardId: "board_threads_backend",
          authorId: "user_threads_author",
          title: "Published architecture notes",
          body: "This published thread should be visible in the public list.",
          status: PrismaThreadStatus.PUBLISHED
        },
        {
          boardId: "board_threads_backend",
          authorId: "user_threads_author",
          title: "Hidden moderation notes",
          body: "This hidden thread should stay out of the public list.",
          status: PrismaThreadStatus.HIDDEN
        }
      ]
    });

    const response = await request(app.getHttpServer()).get("/api/threads").expect(200);

    expect(response.body.threads).toHaveLength(1);
    expect(response.body.threads[0]).toEqual(
      expect.objectContaining({
        title: "Published architecture notes",
        status: "published"
      })
    );
  });

  it("filters published threads by board slug", async () => {
    await prisma.user.create({
      data: {
        id: "user_threads_filter_author",
        email: "filter-author@example.com",
        username: "filter-author",
        passwordHash: "not-used-in-this-test"
      }
    });
    await prisma.thread.createMany({
      data: [
        {
          boardId: "board_threads_backend",
          authorId: "user_threads_filter_author",
          title: "Backend module boundaries",
          body: "This backend thread should appear in the backend board list.",
          status: PrismaThreadStatus.PUBLISHED
        },
        {
          boardId: "board_threads_frontend",
          authorId: "user_threads_filter_author",
          title: "Frontend routing patterns",
          body: "This frontend thread should not appear in the backend board list.",
          status: PrismaThreadStatus.PUBLISHED
        },
        {
          boardId: "board_threads_backend",
          authorId: "user_threads_filter_author",
          title: "Hidden backend moderation notes",
          body: "This hidden backend thread should not appear in public lists.",
          status: PrismaThreadStatus.HIDDEN
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get("/api/threads")
      .query({ boardSlug: "threads-backend" })
      .expect(200);

    expect(response.body.threads).toHaveLength(1);
    expect(response.body.threads[0]).toEqual(
      expect.objectContaining({
        boardSlug: "threads-backend",
        boardName: "后端开发",
        title: "Backend module boundaries",
        status: "published"
      })
    );
  });

  it("searches and filters published threads by keyword and tag", async () => {
    await prisma.user.create({
      data: {
        id: "user_threads_search_author",
        email: "search-author@example.com",
        username: "search-author",
        passwordHash: "not-used-in-this-test"
      }
    });
    await prisma.thread.createMany({
      data: [
        {
          boardId: "board_threads_backend",
          authorId: "user_threads_search_author",
          title: "Docker Compose startup checklist",
          body: "This thread talks about compose dependencies and container health checks.",
          status: PrismaThreadStatus.PUBLISHED,
          tags: ["docker", "compose"]
        },
        {
          boardId: "board_threads_backend",
          authorId: "user_threads_search_author",
          title: "NestJS provider boundaries",
          body: "This thread should not match docker search.",
          status: PrismaThreadStatus.PUBLISHED,
          tags: ["nestjs"]
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get("/api/threads")
      .query({ q: "compose", tag: "docker", sort: "latest" })
      .expect(200);

    expect(response.body.threads).toHaveLength(1);
    expect(response.body.threads[0]).toEqual(
      expect.objectContaining({
        title: "Docker Compose startup checklist",
        tags: ["docker", "compose"]
      })
    );
  });

  it("sorts published threads by popularity", async () => {
    await prisma.user.create({
      data: {
        id: "user_threads_popular_author",
        email: "popular-author@example.com",
        username: "popular-author",
        passwordHash: "not-used-in-this-test"
      }
    });
    const quietThread = await prisma.thread.create({
      data: {
        id: "thread_quiet",
        boardId: "board_threads_backend",
        authorId: "user_threads_popular_author",
        title: "Quiet thread",
        body: "This thread has less engagement.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });
    const popularThread = await prisma.thread.create({
      data: {
        id: "thread_popular",
        boardId: "board_threads_backend",
        authorId: "user_threads_popular_author",
        title: "Popular thread",
        body: "This thread has more engagement.",
        status: PrismaThreadStatus.PUBLISHED,
        viewCount: 99
      }
    });
    await prisma.user.createMany({
      data: [
        { id: "user_reactor_1", email: "reactor1@example.com", username: "reactor1", passwordHash: "not-used" },
        { id: "user_reactor_2", email: "reactor2@example.com", username: "reactor2", passwordHash: "not-used" }
      ]
    });
    await prisma.reaction.createMany({
      data: [
        { threadId: popularThread.id, userId: "user_reactor_1" },
        { threadId: popularThread.id, userId: "user_reactor_2" }
      ]
    });
    await prisma.comment.create({
      data: {
        threadId: quietThread.id,
        authorId: "user_threads_popular_author",
        body: "Quiet comment"
      }
    });

    const response = await request(app.getHttpServer()).get("/api/threads").query({ sort: "popular" }).expect(200);

    expect(response.body.threads.map((thread: { id: string }) => thread.id)).toEqual(["thread_popular", "thread_quiet"]);
    expect(response.body.threads[0]).toEqual(
      expect.objectContaining({
        reactionCount: 2,
        viewCount: 99
      })
    );
  });

  it("returns published thread details", async () => {
    await prisma.user.create({
      data: {
        id: "user_threads_detail_author",
        email: "detail-author@example.com",
        username: "detail-author",
        passwordHash: "not-used-in-this-test"
      }
    });
    const thread = await prisma.thread.create({
      data: {
        id: "thread_detail_published",
        boardId: "board_threads_backend",
        authorId: "user_threads_detail_author",
        title: "Published detail contract",
        body: "The detail endpoint should include the full body for this published thread.",
        status: PrismaThreadStatus.PUBLISHED,
        tags: ["nestjs", "details"]
      }
    });

    const response = await request(app.getHttpServer()).get(`/api/threads/${thread.id}`).expect(200);

    expect(response.body.thread).toEqual(
      expect.objectContaining({
        id: "thread_detail_published",
        boardSlug: "threads-backend",
        boardName: "后端开发",
        authorUsername: "detail-author",
        title: "Published detail contract",
        body: "The detail endpoint should include the full body for this published thread.",
        status: "published",
        tags: ["nestjs", "details"],
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })
    );
  });

  it("returns top-level comments with published thread details ordered by creation time", async () => {
    await prisma.user.createMany({
      data: [
        {
          id: "user_threads_comment_thread_author",
          email: "comment-thread-author@example.com",
          username: "comment-thread-author",
          passwordHash: "not-used-in-this-test"
        },
        {
          id: "user_threads_commenter_one",
          email: "commenter-one@example.com",
          username: "commenter-one",
          passwordHash: "not-used-in-this-test"
        },
        {
          id: "user_threads_commenter_two",
          email: "commenter-two@example.com",
          username: "commenter-two",
          passwordHash: "not-used-in-this-test"
        }
      ]
    });
    const thread = await prisma.thread.create({
      data: {
        id: "thread_detail_with_comments",
        boardId: "board_threads_backend",
        authorId: "user_threads_comment_thread_author",
        title: "Published detail with comments",
        body: "The detail endpoint should include top-level comments for this published thread.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });
    await prisma.comment.createMany({
      data: [
        {
          id: "comment_detail_later",
          threadId: thread.id,
          authorId: "user_threads_commenter_two",
          parentId: null,
          body: "This newer top-level comment should be second.",
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
          updatedAt: new Date("2026-01-03T00:00:00.000Z")
        },
        {
          id: "comment_detail_reply",
          threadId: thread.id,
          authorId: "user_threads_commenter_two",
          parentId: "comment_detail_earlier",
          body: "This reply should not appear in the top-level detail comments.",
          createdAt: new Date("2026-01-02T00:00:00.000Z"),
          updatedAt: new Date("2026-01-02T00:00:00.000Z")
        },
        {
          id: "comment_detail_earlier",
          threadId: thread.id,
          authorId: "user_threads_commenter_one",
          parentId: null,
          body: "This older top-level comment should be first.",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z")
        }
      ]
    });

    const response = await request(app.getHttpServer()).get(`/api/threads/${thread.id}`).expect(200);

    expect(response.body.thread.comments).toEqual([
      {
        id: "comment_detail_earlier",
        threadId: thread.id,
        authorId: "user_threads_commenter_one",
        authorUsername: "commenter-one",
        parentId: null,
        body: "This older top-level comment should be first.",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "comment_detail_later",
        threadId: thread.id,
        authorId: "user_threads_commenter_two",
        authorUsername: "commenter-two",
        parentId: null,
        body: "This newer top-level comment should be second.",
        createdAt: "2026-01-03T00:00:00.000Z",
        updatedAt: "2026-01-03T00:00:00.000Z"
      }
    ]);
  });

  it("does not return non-published thread details", async () => {
    await prisma.user.create({
      data: {
        id: "user_threads_hidden_detail_author",
        email: "hidden-detail-author@example.com",
        username: "hidden-detail-author",
        passwordHash: "not-used-in-this-test"
      }
    });
    await prisma.thread.create({
      data: {
        id: "thread_detail_hidden",
        boardId: "board_threads_backend",
        authorId: "user_threads_hidden_detail_author",
        title: "Hidden detail contract",
        body: "The detail endpoint should not expose this hidden thread.",
        status: PrismaThreadStatus.HIDDEN
      }
    });

    await request(app.getHttpServer()).get("/api/threads/thread_detail_hidden").expect(404);
    await request(app.getHttpServer()).get("/api/threads/thread_detail_missing").expect(404);
  });

  it("lets authors edit their own published threads", async () => {
    const agent = request.agent(app.getHttpServer());
    const registerResponse = await agent.post("/api/auth/register").send({
      email: "editor@example.com",
      username: "editor",
      password: "password123"
    });
    const thread = await prisma.thread.create({
      data: {
        id: "thread_author_edit",
        boardId: "board_threads_backend",
        authorId: registerResponse.body.user.id,
        title: "Original editable title",
        body: "Original body for an editable thread.",
        status: PrismaThreadStatus.PUBLISHED,
        tags: ["original"]
      }
    });

    const response = await agent
      .patch(`/api/threads/${thread.id}`)
      .send({
        title: "Updated editable title",
        body: "Updated body for the editable thread.",
        tags: ["updated", "api"]
      })
      .expect(200);

    expect(response.body.thread).toEqual(
      expect.objectContaining({
        id: thread.id,
        title: "Updated editable title",
        body: "Updated body for the editable thread.",
        tags: ["updated", "api"]
      })
    );
  });

  it("lets admins moderate thread visibility and state", async () => {
    const agent = request.agent(app.getHttpServer());
    const adminResponse = await agent.post("/api/auth/register").send({
      email: "threads-admin@example.com",
      username: "threads-admin",
      password: "password123"
    });
    await prisma.user.update({
      where: { id: adminResponse.body.user.id },
      data: { role: "ADMIN" }
    });
    await prisma.user.create({
      data: {
        id: "user_threads_admin_author",
        email: "admin-author@example.com",
        username: "admin-author",
        passwordHash: "not-used-in-this-test"
      }
    });
    const thread = await prisma.thread.create({
      data: {
        id: "thread_admin_moderate",
        boardId: "board_threads_backend",
        authorId: "user_threads_admin_author",
        title: "Thread needing moderation",
        body: "This thread will be hidden, pinned and locked by an admin.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });

    const response = await agent
      .post(`/api/threads/${thread.id}/moderation`)
      .send({ action: "hide", note: "违规内容" })
      .expect(201);

    expect(response.body.thread).toEqual(
      expect.objectContaining({
        id: thread.id,
        status: "hidden"
      })
    );

    const pinned = await agent.post(`/api/threads/${thread.id}/moderation`).send({ action: "pin" }).expect(201);
    expect(pinned.body.thread.isPinned).toBe(true);

    const locked = await agent.post(`/api/threads/${thread.id}/moderation`).send({ action: "lock" }).expect(201);
    expect(locked.body.thread.isLocked).toBe(true);

    const auditLogs = await prisma.auditLog.findMany({ where: { targetId: thread.id }, orderBy: { createdAt: "asc" } });
    expect(auditLogs.map((log) => log.action)).toEqual(["hide", "pin", "lock"]);
  });

  it("requires authentication to create a comment", async () => {
    await prisma.user.create({
      data: {
        id: "user_threads_unauth_comment_author",
        email: "unauth-comment-author@example.com",
        username: "unauth-comment-author",
        passwordHash: "not-used-in-this-test"
      }
    });
    const thread = await prisma.thread.create({
      data: {
        id: "thread_comment_requires_auth",
        boardId: "board_threads_backend",
        authorId: "user_threads_unauth_comment_author",
        title: "Comment auth contract",
        body: "Creating comments should require an authenticated user.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });

    await request(app.getHttpServer())
      .post(`/api/threads/${thread.id}/comments`)
      .send({ body: "This comment should be rejected without a session." })
      .expect(401);
  });

  it("validates comment input", async () => {
    const agent = request.agent(app.getHttpServer());
    const registerResponse = await agent.post("/api/auth/register").send({
      email: "invalid-commenter@example.com",
      username: "invalid-commenter",
      password: "password123"
    });
    const thread = await prisma.thread.create({
      data: {
        id: "thread_comment_validation",
        boardId: "board_threads_backend",
        authorId: registerResponse.body.user.id,
        title: "Comment validation contract",
        body: "Creating comments should reject invalid request bodies.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });

    await agent.post(`/api/threads/${thread.id}/comments`).send({ body: "" }).expect(400);
  });

  it("creates a comment on a published thread and updates the thread timestamp", async () => {
    const agent = request.agent(app.getHttpServer());
    const registerResponse = await agent.post("/api/auth/register").send({
      email: "commenter@example.com",
      username: "commenter",
      password: "password123"
    });
    const originalUpdatedAt = new Date("2026-01-01T00:00:00.000Z");
    const thread = await prisma.thread.create({
      data: {
        id: "thread_create_comment",
        boardId: "board_threads_backend",
        authorId: registerResponse.body.user.id,
        title: "Create comment contract",
        body: "Creating a comment should return the new comment summary.",
        status: PrismaThreadStatus.PUBLISHED,
        createdAt: originalUpdatedAt,
        updatedAt: originalUpdatedAt
      }
    });

    const response = await agent
      .post(`/api/threads/${thread.id}/comments`)
      .send({ body: "This is the first top-level comment." })
      .expect(201);

    expect(response.body.comment).toEqual({
      id: expect.any(String),
      threadId: thread.id,
      authorId: registerResponse.body.user.id,
      authorUsername: "commenter",
      parentId: null,
      body: "This is the first top-level comment.",
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });

    const updatedThread = await prisma.thread.findUniqueOrThrow({
      where: { id: thread.id },
      select: { updatedAt: true }
    });
    expect(updatedThread.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it("does not create comments on missing or non-published threads", async () => {
    const agent = request.agent(app.getHttpServer());
    const registerResponse = await agent.post("/api/auth/register").send({
      email: "hidden-commenter@example.com",
      username: "hidden-commenter",
      password: "password123"
    });
    await prisma.thread.create({
      data: {
        id: "thread_hidden_comment_target",
        boardId: "board_threads_backend",
        authorId: registerResponse.body.user.id,
        title: "Hidden comment target",
        body: "Hidden threads should not accept new comments.",
        status: PrismaThreadStatus.HIDDEN
      }
    });

    await agent
      .post("/api/threads/thread_missing_comment_target/comments")
      .send({ body: "This missing thread should return not found." })
      .expect(404);
    await agent
      .post("/api/threads/thread_hidden_comment_target/comments")
      .send({ body: "This hidden thread should return not found." })
      .expect(404);
  });

  it("rejects creating threads in closed boards", async () => {
    const agent = request.agent(app.getHttpServer());

    await prisma.board.create({
      data: {
        id: "board_threads_closed",
        slug: "threads-closed",
        name: "关闭分区",
        description: "这个分区暂不允许发布新主题。",
        status: PrismaBoardStatus.CLOSED
      }
    });
    await agent.post("/api/auth/register").send({
      email: "dave@example.com",
      username: "dave",
      password: "password123"
    });

    await agent
      .post("/api/threads")
      .send({
        boardId: "board_threads_closed",
        title: "Can I post in a closed board?",
        body: "This request should be rejected because the board is closed.",
        tags: ["moderation"]
      })
      .expect(400);
  });
});
