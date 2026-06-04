import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("admin API", () => {
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
    await cleanDatabase(prisma);
    await prisma.board.create({
      data: {
        id: "board_admin_backend",
        slug: "admin-backend",
        name: "后端开发",
        description: "后台管理测试分区。"
      }
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("rejects non-admin access to admin endpoints", async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post("/api/auth/register").send({
      email: "plain-admin-test@example.com",
      username: "plain-admin-test",
      password: "password123"
    });

    await agent.get("/api/admin/dashboard").expect(403);
  });

  it("returns dashboard counts and recent audit logs", async () => {
    const agent = await createAdminAgent(app, prisma);
    const author = await prisma.user.create({
      data: {
        id: "user_admin_dashboard_author",
        email: "admin-dashboard-author@example.com",
        username: "admin-dashboard-author",
        passwordHash: "not-used"
      }
    });
    await prisma.thread.create({
      data: {
        id: "thread_admin_dashboard",
        boardId: "board_admin_backend",
        authorId: author.id,
        title: "Dashboard thread",
        body: "This thread contributes to admin dashboard counts.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });
    await prisma.comment.create({
      data: {
        threadId: "thread_admin_dashboard",
        authorId: author.id,
        body: "Dashboard comment"
      }
    });
    await prisma.report.create({
      data: {
        targetType: "THREAD",
        threadId: "thread_admin_dashboard",
        reporterId: author.id,
        reason: "SPAM"
      }
    });

    const response = await agent.get("/api/admin/dashboard").expect(200);

    expect(response.body.dashboard).toEqual(
      expect.objectContaining({
        userCount: 2,
        threadCount: 1,
        commentCount: 1,
        openReportCount: 1,
        pendingReviewCount: 1
      })
    );
    expect(Array.isArray(response.body.auditLogs)).toBe(true);
  });

  it("handles reports and writes audit logs", async () => {
    const agent = await createAdminAgent(app, prisma);
    const reporter = await prisma.user.create({
      data: {
        id: "user_admin_reporter",
        email: "admin-reporter@example.com",
        username: "admin-reporter",
        passwordHash: "not-used"
      }
    });
    const thread = await prisma.thread.create({
      data: {
        id: "thread_admin_report",
        boardId: "board_admin_backend",
        authorId: reporter.id,
        title: "Reported thread",
        body: "This thread will be resolved by an admin.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });
    const report = await prisma.report.create({
      data: {
        targetType: "THREAD",
        threadId: thread.id,
        reporterId: reporter.id,
        reason: "SPAM"
      }
    });

    const list = await agent.get("/api/admin/reports").expect(200);
    expect(list.body.reports).toEqual([
      expect.objectContaining({
        id: report.id,
        status: "open"
      })
    ]);

    const resolved = await agent
      .patch(`/api/admin/reports/${report.id}`)
      .send({ status: "resolved", note: "已隐藏违规内容" })
      .expect(200);

    expect(resolved.body.report).toEqual(
      expect.objectContaining({
        id: report.id,
        status: "resolved",
        resolvedAt: expect.any(String)
      })
    );
    await expect(prisma.auditLog.findFirst({ where: { targetType: "report", targetId: report.id, action: "resolveReport" } })).resolves.toBeTruthy();
  });

  it("updates user role and status", async () => {
    const agent = await createAdminAgent(app, prisma);
    await prisma.user.create({
      data: {
        id: "user_admin_managed",
        email: "managed@example.com",
        username: "managed-user",
        passwordHash: "not-used"
      }
    });

    const updated = await agent
      .patch("/api/admin/users/user_admin_managed")
      .send({ role: "moderator", status: "muted" })
      .expect(200);

    expect(updated.body.user).toEqual(
      expect.objectContaining({
        id: "user_admin_managed",
        role: "moderator",
        status: "muted"
      })
    );
  });

  it("creates and updates boards", async () => {
    const agent = await createAdminAgent(app, prisma);

    const created = await agent
      .post("/api/admin/boards")
      .send({
        slug: "admin-runtime",
        name: "运行时配置",
        description: "讨论环境变量、启动脚本和本地服务。"
      })
      .expect(201);

    expect(created.body.board).toEqual(
      expect.objectContaining({
        slug: "admin-runtime",
        status: "open"
      })
    );

    const updated = await agent
      .patch(`/api/admin/boards/${created.body.board.id}`)
      .send({ status: "closed", description: "暂时关闭发帖。" })
      .expect(200);

    expect(updated.body.board).toEqual(
      expect.objectContaining({
        status: "closed",
        description: "暂时关闭发帖。"
      })
    );
  });

  it("lists and updates tags", async () => {
    const agent = await createAdminAgent(app, prisma);

    const created = await agent
      .post("/api/admin/tags")
      .send({
        name: "docker",
        description: "容器和编排"
      })
      .expect(201);

    expect(created.body.tag).toEqual(
      expect.objectContaining({
        name: "docker",
        status: "active"
      })
    );

    const tags = await agent.get("/api/admin/tags").expect(200);
    expect(tags.body.tags).toEqual([expect.objectContaining({ name: "docker" })]);

    const updated = await agent.patch(`/api/admin/tags/${created.body.tag.id}`).send({ status: "disabled" }).expect(200);
    expect(updated.body.tag.status).toBe("disabled");
  });

  it("lists and moderates threads from admin area", async () => {
    const agent = await createAdminAgent(app, prisma);
    const author = await prisma.user.create({
      data: {
        id: "user_admin_thread_author",
        email: "admin-thread-author@example.com",
        username: "admin-thread-author",
        passwordHash: "not-used"
      }
    });
    await prisma.thread.create({
      data: {
        id: "thread_admin_review",
        boardId: "board_admin_backend",
        authorId: author.id,
        title: "Thread for review",
        body: "This thread appears in the admin review queue.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });

    const threads = await agent.get("/api/admin/threads").expect(200);
    expect(threads.body.threads).toEqual([expect.objectContaining({ id: "thread_admin_review" })]);

    const moderated = await agent
      .post("/api/admin/threads/thread_admin_review/moderation")
      .send({ action: "lock", note: "暂停继续回复" })
      .expect(201);

    expect(moderated.body.thread.isLocked).toBe(true);
    await expect(prisma.auditLog.findFirst({ where: { targetType: "thread", targetId: "thread_admin_review", action: "lock" } })).resolves.toBeTruthy();
  });
});

async function createAdminAgent(app: INestApplication, prisma: PrismaService): Promise<ReturnType<typeof request.agent>> {
  const agent = request.agent(app.getHttpServer());
  const response = await agent.post("/api/auth/register").send({
    email: `admin-${Date.now()}-${Math.random()}@example.com`,
    username: `admin-${Math.random().toString(36).slice(2, 8)}`,
    password: "password123"
  });
  await prisma.user.update({
    where: { id: response.body.user.id },
    data: { role: "ADMIN" }
  });
  return agent;
}

async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.session.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.user.deleteMany();
  await prisma.board.deleteMany();
  await prisma.tag.deleteMany();
}
