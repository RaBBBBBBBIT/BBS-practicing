import { UserRole, UserStatus, type PublicUser } from "@bbs/shared";
import { describe, expect, it, vi } from "vitest";
import { submitAuthForm } from "./auth-form";

const user: PublicUser = {
  id: "user_1",
  email: "alice@example.test",
  username: "alice",
  role: UserRole.User,
  status: UserStatus.Active,
  createdAt: "2026-06-03T00:00:00.000Z"
};

describe("submitAuthForm", () => {
  it("logs users in and redirects to the posting page", async () => {
    const action = vi.fn().mockResolvedValue(user);
    const redirect = vi.fn();

    await submitAuthForm({
      mode: "login",
      values: {
        email: "alice@example.test",
        password: "password123"
      },
      action,
      redirect
    });

    expect(action).toHaveBeenCalledWith({
      email: "alice@example.test",
      password: "password123"
    });
    expect(redirect).toHaveBeenCalledWith("/threads/new");
  });

  it("registers users with a username and redirects to the posting page", async () => {
    const action = vi.fn().mockResolvedValue(user);
    const redirect = vi.fn();

    await submitAuthForm({
      mode: "register",
      values: {
        email: "alice@example.test",
        username: "alice",
        password: "password123"
      },
      action,
      redirect
    });

    expect(action).toHaveBeenCalledWith({
      email: "alice@example.test",
      username: "alice",
      password: "password123"
    });
    expect(redirect).toHaveBeenCalledWith("/threads/new");
  });
});
