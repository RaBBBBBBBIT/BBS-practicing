import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("auth API", () => {
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
  });

  afterEach(async () => {
    await app.close();
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
    const cookies = registerResponse.headers["set-cookie"];
    expect(Array.isArray(cookies) ? cookies.join(";") : cookies).toContain("bbs_session=");

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
