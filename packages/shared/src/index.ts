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

export enum ReportReason {
  Spam = "spam",
  Harassment = "harassment",
  Illegal = "illegal",
  Other = "other"
}

export enum ReportStatus {
  Open = "open",
  Resolved = "resolved",
  Rejected = "rejected"
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

export const listThreadsQuerySchema = z.object({
  q: z.string().max(120).optional(),
  boardSlug: z.string().min(1).max(80).optional(),
  tag: z.string().min(1).max(24).optional(),
  status: z.nativeEnum(ThreadStatus).optional(),
  sort: z.enum(["latest", "oldest", "active", "popular"]).default("active")
});

export type ListThreadsQuery = z.infer<typeof listThreadsQuerySchema>;

export const updateThreadSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  body: z.string().min(10).max(20000).optional(),
  tags: z.array(z.string().min(1).max(24)).max(5).optional()
});

export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;

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
  commentCount: number;
  reactionCount: number;
  bookmarkCount: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
  viewerHasReacted: boolean;
  viewerHasBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadDetail extends Omit<ThreadSummary, "excerpt"> {
  body: string;
  comments: CommentSummary[];
}

export const createReportSchema = z.object({
  targetType: z.enum(["thread", "comment"]),
  targetId: z.string().min(1),
  reason: z.nativeEnum(ReportReason),
  detail: z.string().max(1000).optional()
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const createConversationMessageSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1).max(5000)
});

export type CreateConversationMessageInput = z.infer<typeof createConversationMessageSchema>;

export const moderationActionSchema = z.object({
  action: z.enum(["hide", "restore", "pin", "unpin", "lock", "unlock", "resolveReport", "rejectReport"]),
  note: z.string().max(1000).optional()
});

export type ModerationActionInput = z.infer<typeof moderationActionSchema>;

export const updateUserAdminSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional()
});

export type UpdateUserAdminInput = z.infer<typeof updateUserAdminSchema>;

export const createBoardAdminSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(500),
  status: z.nativeEnum(BoardStatus).default(BoardStatus.Open)
});

export type CreateBoardAdminInput = z.infer<typeof createBoardAdminSchema>;

export const updateBoardAdminSchema = createBoardAdminSchema.partial();

export type UpdateBoardAdminInput = z.infer<typeof updateBoardAdminSchema>;

const tagStatusSchema = z.enum(["active", "disabled"]);

export const createTagAdminSchema = z.object({
  name: z.string().min(1).max(24),
  description: z.string().max(200).default(""),
  status: tagStatusSchema.default("active")
});

export type CreateTagAdminInput = z.infer<typeof createTagAdminSchema>;

export const updateTagAdminSchema = z.object({
  name: z.string().min(1).max(24).optional(),
  description: z.string().max(200).optional(),
  status: tagStatusSchema.optional()
});

export type UpdateTagAdminInput = z.infer<typeof updateTagAdminSchema>;

export const resolveReportSchema = z.object({
  status: z.enum(["resolved", "rejected"]),
  note: z.string().max(1000).optional()
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

export interface NotificationSummary {
  id: string;
  type: "comment" | "reaction" | "follow" | "report" | "moderation" | "message";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  participantId: string;
  participantUsername: string;
  lastMessageBody: string;
  unreadCount: number;
  updatedAt: string;
}

export interface MessageSummary {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  body: string;
  createdAt: string;
}

export interface ReportSummary {
  id: string;
  targetType: "thread" | "comment";
  targetId: string;
  reporterId: string;
  reporterUsername: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface TagSummary {
  id: string;
  name: string;
  description: string;
  status: "active" | "disabled";
  threadCount: number;
}

export interface UserProfileSummary {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  threadCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  viewerIsFollowing: boolean;
  createdAt: string;
}

export interface AdminDashboardSummary {
  userCount: number;
  threadCount: number;
  commentCount: number;
  openReportCount: number;
  pendingReviewCount: number;
}

export interface AdminUserSummary extends PublicUser {
  threadCount: number;
  commentCount: number;
}

export interface AuditLogSummary {
  id: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  note: string | null;
  createdAt: string;
}
