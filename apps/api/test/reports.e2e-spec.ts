import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("reports API", () => {
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
        id: "board_reports_backend",
        slug: "reports-backend",
        name: "后端开发",
        description: "讨论举报相关能力。"
      }
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("reports a thread and a comment", async () => {
    const agent = request.agent(app.getHttpServer());
    const reporterResponse = await agent.post("/api/auth/register").send({
      email: "reporter@example.com",
      username: "reporter",
      password: "password123"
    });
    await prisma.user.createMany({
      data: [
        {
          id: "user_report_author",
          email: "report-author@example.com",
          username: "report-author",
          passwordHash: "not-used"
        },
        {
          id: "user_report_admin",
          email: "report-admin@example.com",
          username: "report-admin",
          passwordHash: "not-used",
          role: "ADMIN"
        }
      ]
    });
    await prisma.thread.create({
      data: {
        id: "thread_report_target",
        boardId: "board_reports_backend",
        authorId: "user_report_author",
        title: "Thread that can be reported",
        body: "This thread is used for the report workflow.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });
    const comment = await prisma.comment.create({
      data: {
        threadId: "thread_report_target",
        authorId: "user_report_author",
        body: "This comment can be reported."
      }
    });

    const threadReport = await agent
      .post("/api/reports")
      .send({
        targetType: "thread",
        targetId: "thread_report_target",
        reason: "spam",
        detail: "重复发布无关内容"
      })
      .expect(201);

    expect(threadReport.body.report).toEqual(
      expect.objectContaining({
        targetType: "thread",
        targetId: "thread_report_target",
        reporterId: reporterResponse.body.user.id,
        reason: "spam",
        detail: "重复发布无关内容",
        status: "open"
      })
    );

    const commentReport = await agent
      .post("/api/reports")
      .send({
        targetType: "comment",
        targetId: comment.id,
        reason: "harassment"
      })
      .expect(201);

    expect(commentReport.body.report).toEqual(
      expect.objectContaining({
        targetType: "comment",
        targetId: comment.id,
        reason: "harassment"
      })
    );
    await expect(prisma.notification.findFirst({ where: { userId: "user_report_admin", type: "REPORT" } })).resolves.toBeTruthy();
  });
});

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
