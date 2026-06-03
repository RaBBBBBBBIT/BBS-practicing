export enum UserRole {
  Guest = "guest",
  User = "user",
  Moderator = "moderator",
  Admin = "admin"
}

export enum UserStatus {
  Active = "active",
  Muted = "muted",
  Banned = "banned"
}

export enum ThreadStatus {
  Draft = "draft",
  Published = "published",
  Hidden = "hidden",
  Deleted = "deleted"
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export function createHealthResponse(service: string): HealthResponse {
  return {
    status: "ok",
    service,
    timestamp: new Date().toISOString()
  };
}
