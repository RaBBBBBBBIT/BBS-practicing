import { describe, expect, it, vi } from "vitest";
import {
  createThread,
  fetchBoards,
  fetchThread,
  fetchThreads,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  resolveApiBaseUrl
} from "./forum-api";

function jsonResponse(body: unknown, init: { status?: number; ok?: boolean } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body
  } as Response;
}

describe("resolveApiBaseUrl", () => {
  it("uses the local API by default", () => {
    expect(resolveApiBaseUrl()).toBe("http://localhost:4000/api");
  });

  it("removes trailing slashes from custom base URLs", () => {
    expect(resolveApiBaseUrl("http://localhost:5000/api///")).toBe("http://localhost:5000/api");
  });
});

describe("forum API client", () => {
  it("fetches boards with browser credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        boards: [
          {
            id: "board_1",
            slug: "backend",
            name: "后端开发",
            description: "讨论服务端工程。",
            status: "open",
            threadCount: 2
          }
        ]
      })
    );

    await expect(fetchBoards(fetcher)).resolves.toHaveLength(1);
    expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/api/boards", {
      credentials: "include"
    });
  });

  it("fetches board-specific thread lists", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        threads: []
      })
    );

    await fetchThreads({ boardSlug: "backend" }, fetcher, "http://example.test/api/");

    expect(fetcher).toHaveBeenCalledWith("http://example.test/api/threads?boardSlug=backend", {
      credentials: "include"
    });
  });

  it("fetches a thread detail", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        thread: {
          id: "thread_1",
          boardId: "board_1",
          boardSlug: "backend",
          boardName: "后端开发",
          authorId: "user_1",
          authorUsername: "alice",
          title: "Runtime thread",
          body: "Full body",
          status: "published",
          tags: [],
          createdAt: "2026-06-03T00:00:00.000Z",
          updatedAt: "2026-06-03T00:00:00.000Z"
        }
      })
    );

    await expect(fetchThread("thread_1", fetcher)).resolves.toMatchObject({
      id: "thread_1",
      body: "Full body"
    });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/api/threads/thread_1", {
      credentials: "include"
    });
  });

  it("creates threads with JSON and browser credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        thread: {
          id: "thread_1",
          title: "Created thread"
        }
      })
    );

    await createThread(
      {
        boardId: "board_1",
        title: "Created thread",
        body: "Created thread body",
        tags: ["nestjs"]
      },
      fetcher
    );

    expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/api/threads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        boardId: "board_1",
        title: "Created thread",
        body: "Created thread body",
        tags: ["nestjs"]
      })
    });
  });

  it("returns null for an anonymous current user", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ message: "Authentication required" }, { ok: false, status: 401 }));

    await expect(getCurrentUser(fetcher)).resolves.toBeNull();
  });

  it("registers users with JSON and browser credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        user: {
          id: "user_1",
          email: "alice@example.test",
          username: "alice",
          role: "user",
          status: "active",
          createdAt: "2026-06-03T00:00:00.000Z"
        }
      })
    );

    await expect(
      registerUser(
        {
          email: "alice@example.test",
          username: "alice",
          password: "password123"
        },
        fetcher
      )
    ).resolves.toMatchObject({
      id: "user_1",
      username: "alice"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: "alice@example.test",
        username: "alice",
        password: "password123"
      })
    });
  });

  it("logs users in with JSON and browser credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      jsonResponse({
        user: {
          id: "user_1",
          email: "alice@example.test",
          username: "alice",
          role: "user",
          status: "active",
          createdAt: "2026-06-03T00:00:00.000Z"
        }
      })
    );

    await expect(
      loginUser(
        {
          email: "alice@example.test",
          password: "password123"
        },
        fetcher
      )
    ).resolves.toMatchObject({
      id: "user_1",
      username: "alice"
    });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: "alice@example.test",
        password: "password123"
      })
    });
  });

  it("logs users out with browser credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(null, { status: 204 }));

    await expect(logoutUser(fetcher)).resolves.toBeUndefined();

    expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });
  });

  it("throws API errors with status codes", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ message: "Server error" }, { ok: false, status: 500 }));

    await expect(fetchBoards(fetcher)).rejects.toThrow("API request failed with status 500");
  });
});
