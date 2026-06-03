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
