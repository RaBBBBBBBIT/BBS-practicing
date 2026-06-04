import { describe, expect, it } from "vitest";
import {
  BoardStatus,
  createConversationMessageSchema,
  createCommentSchema,
  createHealthResponse,
  createBoardAdminSchema,
  createTagAdminSchema,
  createReportSchema,
  createThreadSchema,
  listThreadsQuerySchema,
  loginSchema,
  moderationActionSchema,
  registerSchema,
  resolveReportSchema,
  ReportReason,
  ReportStatus,
  ThreadStatus,
  updateBoardAdminSchema,
  updateTagAdminSchema,
  updateUserAdminSchema,
  UserRole,
  UserStatus
} from "./index";
import type {
  AdminDashboardSummary,
  AdminUserSummary,
  AuditLogSummary,
  CommentSummary,
  ConversationSummary,
  NotificationSummary,
  TagSummary,
  ThreadDetail,
  ThreadSummary,
  UserProfileSummary
} from "./index";

describe("shared domain constants", () => {
  it("exposes stable role and status values", () => {
    expect(UserRole.Admin).toBe("admin");
    expect(UserStatus.Muted).toBe("muted");
    expect(ThreadStatus.Published).toBe("published");
    expect(BoardStatus.Open).toBe("open");
  });
});

describe("createHealthResponse", () => {
  it("creates an API health payload with an ISO timestamp", () => {
    const response = createHealthResponse("api");

    expect(response.status).toBe("ok");
    expect(response.service).toBe("api");
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});

describe("auth schemas", () => {
  it("accepts a valid registration payload", () => {
    expect(
      registerSchema.parse({
        email: "alice@example.com",
        username: "alice",
        password: "password123"
      })
    ).toEqual({
      email: "alice@example.com",
      username: "alice",
      password: "password123"
    });
  });

  it("rejects short passwords", () => {
    expect(() =>
      registerSchema.parse({
        email: "alice@example.com",
        username: "alice",
        password: "short"
      })
    ).toThrow();
  });

  it("rejects usernames with unsupported characters", () => {
    expect(() =>
      registerSchema.parse({
        email: "alice@example.com",
        username: "alice!",
        password: "password123"
      })
    ).toThrow();
  });

  it("accepts a valid login payload", () => {
    expect(
      loginSchema.parse({
        email: "alice@example.com",
        password: "password123"
      })
    ).toEqual({
      email: "alice@example.com",
      password: "password123"
    });
  });
});

describe("thread schemas", () => {
  it("normalizes a valid thread creation payload", () => {
    expect(
      createThreadSchema.parse({
        boardId: "board_123",
        title: "How do I debug NestJS providers?",
        body: "I am trying to understand dependency injection.",
        tags: ["nestjs", "debugging"]
      })
    ).toEqual({
      boardId: "board_123",
      title: "How do I debug NestJS providers?",
      body: "I am trying to understand dependency injection.",
      tags: ["nestjs", "debugging"]
    });
  });

  it("defaults missing tags to an empty list", () => {
    expect(
      createThreadSchema.parse({
        boardId: "board_123",
        title: "How do I debug NestJS providers?",
        body: "I am trying to understand dependency injection."
      })
    ).toEqual({
      boardId: "board_123",
      title: "How do I debug NestJS providers?",
      body: "I am trying to understand dependency injection.",
      tags: []
    });
  });

  it("rejects more than five tags", () => {
    expect(() =>
      createThreadSchema.parse({
        boardId: "board_123",
        title: "How do I debug NestJS providers?",
        body: "I am trying to understand dependency injection.",
        tags: ["one", "two", "three", "four", "five", "six"]
      })
    ).toThrow();
  });

  it("defines the public thread detail contract", () => {
    const comment: CommentSummary = {
      id: "comment_1",
      threadId: "thread_123",
      authorId: "user_456",
      authorUsername: "bob",
      parentId: null,
      body: "真实评论",
      createdAt: "2026-06-03T01:00:00.000Z",
      updatedAt: "2026-06-03T01:00:00.000Z"
    };

    const detail: ThreadDetail = {
      id: "thread_123",
      boardId: "board_123",
      boardSlug: "backend",
      boardName: "后端开发",
      authorId: "user_123",
      authorUsername: "alice",
      title: "How do I debug NestJS providers?",
      body: "I am trying to understand dependency injection.",
      status: ThreadStatus.Published,
      tags: ["nestjs", "debugging"],
      comments: [comment],
      commentCount: 1,
      reactionCount: 0,
      bookmarkCount: 0,
      viewCount: 0,
      isPinned: false,
      isLocked: false,
      viewerHasReacted: false,
      viewerHasBookmarked: false,
      createdAt: "2026-06-03T00:00:00.000Z",
      updatedAt: "2026-06-03T00:00:00.000Z"
    };

    expect(detail.boardName).toBe("后端开发");
    expect(detail.body).toContain("dependency injection");
    expect(detail.comments[0]?.body).toBe("真实评论");
  });

  it("validates comment creation input", () => {
    expect(createCommentSchema.parse({ body: "这是一条评论" })).toEqual({ body: "这是一条评论" });
    expect(() => createCommentSchema.parse({ body: "" })).toThrow();
    expect(() => createCommentSchema.parse({ body: "a".repeat(5001) })).toThrow();
  });

  it("validates public thread search and filter query input", () => {
    expect(
      listThreadsQuerySchema.parse({
        q: "docker",
        boardSlug: "devops",
        tag: "compose",
        status: ThreadStatus.Published,
        sort: "latest"
      })
    ).toEqual({
      q: "docker",
      boardSlug: "devops",
      tag: "compose",
      status: ThreadStatus.Published,
      sort: "latest"
    });
    expect(() => listThreadsQuerySchema.parse({ sort: "random" })).toThrow();
  });

  it("describes thread summaries with interaction metrics", () => {
    const thread: ThreadSummary = {
      id: "thread_1",
      boardId: "board_1",
      boardSlug: "devops",
      boardName: "部署运维",
      authorId: "user_1",
      authorUsername: "alice",
      title: "Docker Compose 依赖服务启动清单",
      excerpt: "排查依赖服务启动顺序。",
      status: ThreadStatus.Published,
      tags: ["docker"],
      commentCount: 2,
      reactionCount: 3,
      bookmarkCount: 1,
      viewCount: 42,
      isPinned: true,
      isLocked: false,
      viewerHasReacted: false,
      viewerHasBookmarked: true,
      createdAt: "2026-06-04T00:00:00.000Z",
      updatedAt: "2026-06-04T00:00:00.000Z"
    };

    expect(thread.commentCount).toBe(2);
    expect(thread.viewerHasBookmarked).toBe(true);
  });
});

describe("community interaction schemas", () => {
  it("validates report creation input", () => {
    expect(
      createReportSchema.parse({
        targetType: "thread",
        targetId: "thread_1",
        reason: ReportReason.Spam,
        detail: "重复广告"
      })
    ).toEqual({
      targetType: "thread",
      targetId: "thread_1",
      reason: ReportReason.Spam,
      detail: "重复广告"
    });
    expect(() => createReportSchema.parse({ targetType: "thread", targetId: "", reason: "unknown" })).toThrow();
  });

  it("validates direct message input", () => {
    expect(createConversationMessageSchema.parse({ recipientId: "user_2", body: "你好" })).toEqual({
      recipientId: "user_2",
      body: "你好"
    });
    expect(() => createConversationMessageSchema.parse({ recipientId: "user_2", body: "" })).toThrow();
  });

  it("describes notifications, conversations, tags, profiles and admin dashboard data", () => {
    const notification: NotificationSummary = {
      id: "notice_1",
      type: "comment",
      title: "有新的评论",
      body: "bob 评论了你的主题。",
      isRead: false,
      createdAt: "2026-06-04T00:00:00.000Z"
    };
    const conversation: ConversationSummary = {
      id: "conversation_1",
      participantId: "user_2",
      participantUsername: "bob",
      lastMessageBody: "收到",
      unreadCount: 1,
      updatedAt: "2026-06-04T00:00:00.000Z"
    };
    const tag: TagSummary = {
      id: "tag_docker",
      name: "docker",
      description: "容器和编排",
      status: "active",
      threadCount: 4
    };
    const profile: UserProfileSummary = {
      id: "user_1",
      username: "alice",
      role: UserRole.User,
      status: UserStatus.Active,
      threadCount: 3,
      commentCount: 8,
      followerCount: 2,
      followingCount: 1,
      viewerIsFollowing: false,
      createdAt: "2026-06-04T00:00:00.000Z"
    };
    const dashboard: AdminDashboardSummary = {
      userCount: 3,
      threadCount: 5,
      commentCount: 8,
      openReportCount: 2,
      pendingReviewCount: 1
    };

    expect(notification.isRead).toBe(false);
    expect(conversation.unreadCount).toBe(1);
    expect(tag.threadCount).toBe(4);
    expect(profile.viewerIsFollowing).toBe(false);
    expect(dashboard.openReportCount).toBe(2);
  });
});

describe("admin schemas", () => {
  it("validates moderation actions", () => {
    expect(moderationActionSchema.parse({ action: "hide", note: "违规内容" })).toEqual({
      action: "hide",
      note: "违规内容"
    });
    expect(() => moderationActionSchema.parse({ action: "explode" })).toThrow();
  });

  it("exposes stable report statuses", () => {
    expect(ReportStatus.Open).toBe("open");
    expect(ReportStatus.Resolved).toBe("resolved");
  });

  it("validates admin user, board, tag and report inputs", () => {
    expect(updateUserAdminSchema.parse({ role: UserRole.Moderator, status: UserStatus.Muted })).toEqual({
      role: UserRole.Moderator,
      status: UserStatus.Muted
    });
    expect(
      createBoardAdminSchema.parse({
        slug: "runtime-config",
        name: "运行时配置",
        description: "运行时配置问题"
      })
    ).toEqual({
      slug: "runtime-config",
      name: "运行时配置",
      description: "运行时配置问题",
      status: BoardStatus.Open
    });
    expect(updateBoardAdminSchema.parse({ status: BoardStatus.Closed })).toEqual({ status: BoardStatus.Closed });
    expect(createTagAdminSchema.parse({ name: "docker" })).toEqual({
      name: "docker",
      description: "",
      status: "active"
    });
    expect(updateTagAdminSchema.parse({ status: "disabled" })).toEqual({ status: "disabled" });
    expect(resolveReportSchema.parse({ status: "resolved", note: "已处理" })).toEqual({
      status: "resolved",
      note: "已处理"
    });
  });

  it("describes admin user and audit log summaries", () => {
    const user: AdminUserSummary = {
      id: "user_1",
      email: "alice@example.com",
      username: "alice",
      role: UserRole.Admin,
      status: UserStatus.Active,
      threadCount: 2,
      commentCount: 5,
      createdAt: "2026-06-04T00:00:00.000Z"
    };
    const auditLog: AuditLogSummary = {
      id: "audit_1",
      actorId: "user_1",
      actorUsername: "alice",
      action: "resolveReport",
      targetType: "report",
      targetId: "report_1",
      note: "已处理",
      createdAt: "2026-06-04T00:00:00.000Z"
    };

    expect(user.role).toBe(UserRole.Admin);
    expect(auditLog.action).toBe("resolveReport");
  });
});
