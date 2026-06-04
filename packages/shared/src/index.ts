import { z } from "zod";

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

export enum BoardStatus {
  Open = "open",
  Closed = "closed"
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

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  createdAt: z.string().datetime()
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const registerSchema = z.object({
  email: z.string().email().max(120),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(72)
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(72)
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface AuthSessionResponse {
  user: PublicUser;
}

export interface BoardSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: BoardStatus;
  threadCount: number;
}

export const createThreadSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().min(5).max(120),
  body: z.string().min(10).max(20000),
  tags: z.array(z.string().min(1).max(24)).max(5).default([])
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000)
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export interface CommentSummary {
  id: string;
  threadId: string;
  authorId: string;
  authorUsername: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadSummary {
  id: string;
  boardId: string;
  boardSlug: string;
  boardName: string;
  authorId: string;
  authorUsername: string;
  title: string;
  excerpt: string;
  status: ThreadStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ThreadDetail extends Omit<ThreadSummary, "excerpt"> {
  body: string;
  comments: CommentSummary[];
}
