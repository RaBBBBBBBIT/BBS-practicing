import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import cookieParser from "cookie-parser";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("interactions API", () => {
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
        id: "board_interactions_backend",
        slug: "interactions-backend",
        name: "后端开发",
        description: "讨论服务端互动能力。"
      }
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it("likes and unlikes a published thread", async () => {
    const agent = request.agent(app.getHttpServer());
    const viewerResponse = await agent.post("/api/auth/register").send({
      email: "interaction-viewer@example.com",
      username: "interaction-viewer",
      password: "password123"
    });
    await prisma.user.create({
      data: {
        id: "user_interaction_author",
        email: "interaction-author@example.com",
        username: "interaction-author",
        passwordHash: "not-used"
      }
    });
    await prisma.thread.create({
      data: {
        id: "thread_interaction_like",
        boardId: "board_interactions_backend",
        authorId: "user_interaction_author",
        title: "Thread with reactions",
        body: "This thread can receive a real reaction.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });

    const liked = await agent.post("/api/threads/thread_interaction_like/reactions").expect(201);

    expect(liked.body.thread).toEqual(
      expect.objectContaining({
        id: "thread_interaction_like",
        reactionCount: 1,
        viewerHasReacted: true
      })
    );
    await expect(
      prisma.reaction.findUnique({
        where: {
          threadId_userId: {
            threadId: "thread_interaction_like",
            userId: viewerResponse.body.user.id
          }
        }
      })
    ).resolves.toBeTruthy();
    await expect(prisma.notification.findFirst({ where: { userId: "user_interaction_author", type: "REACTION" } })).resolves.toBeTruthy();

    const unliked = await agent.delete("/api/threads/thread_interaction_like/reactions").expect(200);

    expect(unliked.body.thread).toEqual(
      expect.objectContaining({
        reactionCount: 0,
        viewerHasReacted: false
      })
    );
  });

  it("bookmarks and removes a thread bookmark", async () => {
    const agent = request.agent(app.getHttpServer());
    const viewerResponse = await agent.post("/api/auth/register").send({
      email: "bookmark-viewer@example.com",
      username: "bookmark-viewer",
      password: "password123"
    });
    await prisma.user.create({
      data: {
        id: "user_bookmark_author",
        email: "bookmark-author@example.com",
        username: "bookmark-author",
        passwordHash: "not-used"
      }
    });
    await prisma.thread.create({
      data: {
        id: "thread_interaction_bookmark",
        boardId: "board_interactions_backend",
        authorId: "user_bookmark_author",
        title: "Thread with bookmarks",
        body: "This thread can be bookmarked by a real user.",
        status: PrismaThreadStatus.PUBLISHED
      }
    });

    const bookmarked = await agent.post("/api/threads/thread_interaction_bookmark/bookmarks").expect(201);

    expect(bookmarked.body.thread).toEqual(
      expect.objectContaining({
        bookmarkCount: 1,
        viewerHasBookmarked: true
      })
    );
    await expect(
      prisma.bookmark.findUnique({
        where: {
          threadId_userId: {
            threadId: "thread_interaction_bookmark",
            userId: viewerResponse.body.user.id
          }
        }
      })
    ).resolves.toBeTruthy();

    const removed = await agent.delete("/api/threads/thread_interaction_bookmark/bookmarks").expect(200);
    expect(removed.body.thread.bookmarkCount).toBe(0);
    expect(removed.body.thread.viewerHasBookmarked).toBe(false);
  });

  it("follows and unfollows another user", async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post("/api/auth/register").send({
      email: "follower@example.com",
      username: "follower",
      password: "password123"
    });
    await prisma.user.create({
      data: {
        id: "user_following_target",
        email: "following-target@example.com",
        username: "following-target",
        passwordHash: "not-used"
      }
    });

    const followed = await agent.post("/api/users/user_following_target/follow").expect(201);

    expect(followed.body.user).toEqual(
      expect.objectContaining({
        id: "user_following_target",
        username: "following-target",
        followerCount: 1,
        viewerIsFollowing: true
      })
    );
    await expect(prisma.notification.findFirst({ where: { userId: "user_following_target", type: "FOLLOW" } })).resolves.toBeTruthy();

    const unfollowed = await agent.delete("/api/users/user_following_target/follow").expect(200);
    expect(unfollowed.body.user.followerCount).toBe(0);
    expect(unfollowed.body.user.viewerIsFollowing).toBe(false);
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
