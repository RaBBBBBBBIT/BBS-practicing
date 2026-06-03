import { describe, expect, it } from "vitest";
import { createHealthResponse, ThreadStatus, UserRole, UserStatus } from "./index";

describe("shared domain constants", () => {
  it("exposes stable role and status values", () => {
    expect(UserRole.Admin).toBe("admin");
    expect(UserStatus.Muted).toBe("muted");
    expect(ThreadStatus.Published).toBe("published");
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
