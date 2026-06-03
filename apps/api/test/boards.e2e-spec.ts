import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("boards API", () => {
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
    await prisma.board.createMany({
      data: [
        {
          slug: "boards-z-alpha",
          name: "Alpha 分区",
          description: "讨论 NestJS、数据库、API 设计和服务端工程。"
        },
        {
          slug: "boards-a-zulu",
          name: "Zulu 分区",
          description: "讨论 React、Next.js、CSS 和前端工程化。"
        }
      ]
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("lists boards with thread counts", async () => {
    const response = await request(app.getHttpServer()).get("/api/boards").expect(200);

    expect(response.body.boards).toHaveLength(2);
    expect(response.body.boards[0]).toEqual(
      expect.objectContaining({
        slug: "boards-z-alpha",
        name: "Alpha 分区",
        status: "open",
        threadCount: 0
      })
    );
  });
});
