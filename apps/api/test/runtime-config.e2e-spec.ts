import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("runtime configuration", () => {
  let app: INestApplication;
  let originalDatabaseUrl: string | undefined;

  beforeEach(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterEach(async () => {
    await app.close();

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });

  it("uses the local PostgreSQL URL when DATABASE_URL is not set", async () => {
    const prisma = app.get(PrismaService);

    await prisma.session.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.thread.deleteMany();
    await prisma.user.deleteMany();
    await prisma.board.deleteMany();
    await prisma.board.create({
      data: {
        slug: "runtime-config",
        name: "运行时配置",
        description: "验证 API 开发服务缺省使用本地 PostgreSQL。"
      }
    });

    const response = await request(app.getHttpServer()).get("/api/boards").expect(200);

    expect(response.body.boards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "runtime-config"
        })
      ])
    );
  });
});
