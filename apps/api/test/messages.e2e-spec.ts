import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("messages API", () => {
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

  it("creates a one-to-one conversation and lists messages", async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post("/api/auth/register").send({
      email: "message-sender@example.com",
      username: "message-sender",
      password: "password123"
    });
    await prisma.user.create({
      data: {
        id: "user_message_recipient",
        email: "message-recipient@example.com",
        username: "message-recipient",
        passwordHash: "not-used"
      }
    });

    const sent = await agent
      .post("/api/messages")
      .send({
        recipientId: "user_message_recipient",
        body: "你好，这是一条真实私信。"
      })
      .expect(201);

    expect(sent.body.conversation).toEqual(
      expect.objectContaining({
        participantId: "user_message_recipient",
        participantUsername: "message-recipient",
        lastMessageBody: "你好，这是一条真实私信。"
      })
    );
    expect(sent.body.message).toEqual(
      expect.objectContaining({
        body: "你好，这是一条真实私信。",
        senderUsername: "message-sender"
      })
    );
    await expect(prisma.notification.findFirst({ where: { userId: "user_message_recipient", type: "MESSAGE" } })).resolves.toBeTruthy();

    const conversations = await agent.get("/api/messages/conversations").expect(200);
    expect(conversations.body.conversations).toHaveLength(1);

    const messages = await agent.get(`/api/messages/conversations/${sent.body.conversation.id}`).expect(200);
    expect(messages.body.messages).toEqual([
      expect.objectContaining({
        body: "你好，这是一条真实私信。",
        senderUsername: "message-sender"
      })
    ]);
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
