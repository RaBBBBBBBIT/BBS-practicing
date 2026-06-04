import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("notifications API", () => {
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
  });

  afterEach(async () => {
    await app.close();
  });

  it("lists notifications and marks them as read", async () => {
    const agent = request.agent(app.getHttpServer());
    const registerResponse = await agent.post("/api/auth/register").send({
      email: "notify-user@example.com",
      username: "notify-user",
      password: "password123"
    });
    const notification = await prisma.notification.create({
      data: {
        userId: registerResponse.body.user.id,
        type: "COMMENT",
        title: "有新的评论",
        body: "alice 评论了你的主题。"
      }
    });

    const list = await agent.get("/api/notifications").expect(200);
    expect(list.body.notifications).toEqual([
      expect.objectContaining({
        id: notification.id,
        type: "comment",
        isRead: false
      })
    ]);

    const marked = await agent.patch(`/api/notifications/${notification.id}/read`).expect(200);
    expect(marked.body.notification).toEqual(
      expect.objectContaining({
        id: notification.id,
        isRead: true
      })
    );

    const unread = await prisma.notification.count({ where: { userId: registerResponse.body.user.id, isRead: false } });
    expect(unread).toBe(0);
  });

  it("marks all notifications as read", async () => {
    const agent = request.agent(app.getHttpServer());
    const registerResponse = await agent.post("/api/auth/register").send({
      email: "notify-all@example.com",
      username: "notify-all",
      password: "password123"
    });
    await prisma.notification.createMany({
      data: [
        { userId: registerResponse.body.user.id, type: "COMMENT", title: "评论", body: "第一条通知" },
        { userId: registerResponse.body.user.id, type: "FOLLOW", title: "关注", body: "第二条通知" }
      ]
    });

    const response = await agent.patch("/api/notifications/read-all").expect(200);

    expect(response.body.updatedCount).toBe(2);
    await expect(prisma.notification.count({ where: { userId: registerResponse.body.user.id, isRead: false } })).resolves.toBe(0);
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
