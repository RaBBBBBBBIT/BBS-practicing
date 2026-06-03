import { describe, expect, it } from "vitest";
import {
  BoardStatus,
  createHealthResponse,
  createThreadSchema,
  loginSchema,
  registerSchema,
  ThreadStatus,
  UserRole,
  UserStatus
} from "./index";
import type { ThreadDetail } from "./index";

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
      createdAt: "2026-06-03T00:00:00.000Z",
      updatedAt: "2026-06-03T00:00:00.000Z"
    };

    expect(detail.boardName).toBe("后端开发");
    expect(detail.body).toContain("dependency injection");
  });
});
