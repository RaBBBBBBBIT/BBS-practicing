import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  BoardStatus as PrismaBoardStatus,
  ReportReason as PrismaReportReason,
  ReportStatus as PrismaReportStatus,
  ReportTarget as PrismaReportTarget,
  TagStatus as PrismaTagStatus,
  ThreadStatus as PrismaThreadStatus,
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus
} from "@prisma/client";
import {
  BoardStatus,
  ReportReason,
  ReportStatus,
  ThreadStatus,
  UserRole,
  UserStatus,
  type AdminDashboardSummary,
  type AdminUserSummary,
  type AuditLogSummary,
  type BoardSummary,
  type CreateBoardAdminInput,
  type CreateTagAdminInput,
  type ModerationActionInput,
  type PublicUser,
  type ReportSummary,
  type ResolveReportInput,
  type TagSummary,
  type ThreadDetail,
  type ThreadSummary,
  type UpdateBoardAdminInput,
  type UpdateTagAdminInput,
  type UpdateUserAdminInput
} from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AdminService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getDashboard(): Promise<{ dashboard: AdminDashboardSummary; auditLogs: AuditLogSummary[] }> {
    const [userCount, threadCount, commentCount, openReportCount, pendingReviewCount, auditLogs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.thread.count(),
      this.prisma.comment.count(),
      this.prisma.report.count({ where: { status: PrismaReportStatus.OPEN } }),
      this.prisma.report.count({ where: { status: PrismaReportStatus.OPEN } }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { actor: true }
      })
    ]);

    return {
      dashboard: {
        userCount,
        threadCount,
        commentCount,
        openReportCount,
        pendingReviewCount
      },
      auditLogs: auditLogs.map((auditLog) => this.toAuditLogSummary(auditLog))
    };
  }

  async listReports(): Promise<ReportSummary[]> {
    const reports = await this.prisma.report.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { reporter: true }
    });

    return reports.map((report) => this.toReportSummary(report));
  }

  async updateReport(reportId: string, input: ResolveReportInput, actor: PublicUser): Promise<ReportSummary> {
    const existingReport = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true }
    });

    if (!existingReport) {
      throw new NotFoundException("Report not found");
    }

    const updatedReport = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.update({
        where: { id: reportId },
        data: {
          status: input.status === "resolved" ? PrismaReportStatus.RESOLVED : PrismaReportStatus.REJECTED,
          resolvedAt: new Date()
        },
        include: { reporter: true }
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: input.status === "resolved" ? "resolveReport" : "rejectReport",
          targetType: "report",
          targetId: reportId,
          note: input.note ?? null
        }
      });

      await tx.notification.create({
        data: {
          userId: report.reporterId,
          type: "MODERATION",
          title: input.status === "resolved" ? "你的举报已处理" : "你的举报已驳回",
          body: input.note ?? "管理员已经处理了你的举报。"
        }
      });

      return report;
    });

    return this.toReportSummary(updatedReport);
  }

  async updateUser(userId: string, input: UpdateUserAdminInput, actor: PublicUser): Promise<AdminUserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...(input.role ? { role: this.toPrismaUserRole(input.role) } : {}),
          ...(input.status ? { status: this.toPrismaUserStatus(input.status) } : {})
        },
        include: {
          _count: {
            select: {
              threads: true,
              comments: true
            }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "updateUser",
          targetType: "user",
          targetId: userId,
          note: JSON.stringify(input)
        }
      });

      return updated;
    });

    return this.toAdminUserSummary(updatedUser);
  }

  async listBoards(): Promise<BoardSummary[]> {
    const boards = await this.prisma.board.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { threads: true }
        }
      }
    });

    return boards.map((board) => this.toBoardSummary(board));
  }

  async createBoard(input: CreateBoardAdminInput, actor: PublicUser): Promise<BoardSummary> {
    const board = await this.prisma.$transaction(async (tx) => {
      const created = await tx.board.create({
        data: {
          slug: input.slug,
          name: input.name,
          description: input.description,
          status: this.toPrismaBoardStatus(input.status)
        },
        include: {
          _count: {
            select: { threads: true }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "createBoard",
          targetType: "board",
          targetId: created.id,
          note: created.slug
        }
      });

      return created;
    });

    return this.toBoardSummary(board);
  }

  async updateBoard(boardId: string, input: UpdateBoardAdminInput, actor: PublicUser): Promise<BoardSummary> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true }
    });

    if (!board) {
      throw new NotFoundException("Board not found");
    }

    const updatedBoard = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.board.update({
        where: { id: boardId },
        data: {
          ...(input.slug ? { slug: input.slug } : {}),
          ...(input.name ? { name: input.name } : {}),
          ...(input.description ? { description: input.description } : {}),
          ...(input.status ? { status: this.toPrismaBoardStatus(input.status) } : {})
        },
        include: {
          _count: {
            select: { threads: true }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "updateBoard",
          targetType: "board",
          targetId: boardId,
          note: JSON.stringify(input)
        }
      });

      return updated;
    });

    return this.toBoardSummary(updatedBoard);
  }

  async listTags(): Promise<TagSummary[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: "asc" }
    });

    return tags.map((tag) => this.toTagSummary(tag));
  }

  async createTag(input: CreateTagAdminInput, actor: PublicUser): Promise<TagSummary> {
    const tag = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tag.create({
        data: {
          name: input.name,
          description: input.description,
          status: this.toPrismaTagStatus(input.status),
          threadCount: await tx.thread.count({ where: { tags: { has: input.name }, status: PrismaThreadStatus.PUBLISHED } })
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "createTag",
          targetType: "tag",
          targetId: created.id,
          note: created.name
        }
      });

      return created;
    });

    return this.toTagSummary(tag);
  }

  async updateTag(tagId: string, input: UpdateTagAdminInput, actor: PublicUser): Promise<TagSummary> {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true }
    });

    if (!tag) {
      throw new NotFoundException("Tag not found");
    }

    const updatedTag = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tag.update({
        where: { id: tagId },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.status ? { status: this.toPrismaTagStatus(input.status) } : {})
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "updateTag",
          targetType: "tag",
          targetId: tagId,
          note: JSON.stringify(input)
        }
      });

      return updated;
    });

    return this.toTagSummary(updatedTag);
  }

  async listThreads(): Promise<ThreadSummary[]> {
    const threads = await this.prisma.thread.findMany({
      orderBy: [{ updatedAt: "desc" }],
      include: {
        board: true,
        author: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
            bookmarks: true
          }
        }
      }
    });

    return threads.map((thread) => this.toThreadSummary(thread));
  }

  async moderateThread(threadId: string, input: ModerationActionInput, actor: PublicUser): Promise<ThreadDetail> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true }
    });

    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    const data: Partial<{
      status: PrismaThreadStatus;
      isPinned: boolean;
      isLocked: boolean;
    }> = {};

    if (input.action === "hide") {
      data.status = PrismaThreadStatus.HIDDEN;
    }

    if (input.action === "restore") {
      data.status = PrismaThreadStatus.PUBLISHED;
    }

    if (input.action === "pin") {
      data.isPinned = true;
    }

    if (input.action === "unpin") {
      data.isPinned = false;
    }

    if (input.action === "lock") {
      data.isLocked = true;
    }

    if (input.action === "unlock") {
      data.isLocked = false;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("Unsupported thread moderation action");
    }

    await this.prisma.$transaction([
      this.prisma.thread.update({
        where: { id: threadId },
        data
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: input.action,
          targetType: "thread",
          targetId: threadId,
          note: input.note ?? null
        }
      })
    ]);

    return this.getThreadDetail(threadId);
  }

  private async getThreadDetail(threadId: string): Promise<ThreadDetail> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        board: true,
        author: true,
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: { author: true }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
            bookmarks: true
          }
        }
      }
    });

    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    return {
      ...this.toThreadSummary(thread),
      body: thread.body,
      comments: thread.comments.map((comment) => ({
        id: comment.id,
        threadId: comment.threadId,
        authorId: comment.authorId,
        authorUsername: comment.author.username,
        parentId: comment.parentId,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString()
      }))
    };
  }

  private toThreadSummary(thread: {
    id: string;
    boardId: string;
    board: { slug: string; name: string };
    authorId: string;
    author: { username: string };
    title: string;
    body: string;
    status: PrismaThreadStatus;
    tags: string[];
    isPinned: boolean;
    isLocked: boolean;
    viewCount: number;
    _count: { comments: number; reactions: number; bookmarks: number };
    createdAt: Date;
    updatedAt: Date;
  }): ThreadSummary {
    return {
      id: thread.id,
      boardId: thread.boardId,
      boardSlug: thread.board.slug,
      boardName: thread.board.name,
      authorId: thread.authorId,
      authorUsername: thread.author.username,
      title: thread.title,
      excerpt: thread.body.length > 160 ? `${thread.body.slice(0, 157)}...` : thread.body,
      status: this.toPublicThreadStatus(thread.status),
      tags: thread.tags,
      commentCount: thread._count.comments,
      reactionCount: thread._count.reactions,
      bookmarkCount: thread._count.bookmarks,
      viewCount: thread.viewCount,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      viewerHasReacted: false,
      viewerHasBookmarked: false,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString()
    };
  }

  private toBoardSummary(board: {
    id: string;
    slug: string;
    name: string;
    description: string;
    status: PrismaBoardStatus;
    _count: { threads: number };
  }): BoardSummary {
    return {
      id: board.id,
      slug: board.slug,
      name: board.name,
      description: board.description,
      status: this.toPublicBoardStatus(board.status),
      threadCount: board._count.threads
    };
  }

  private toTagSummary(tag: { id: string; name: string; description: string; status: PrismaTagStatus; threadCount: number }): TagSummary {
    return {
      id: tag.id,
      name: tag.name,
      description: tag.description,
      status: tag.status === PrismaTagStatus.ACTIVE ? "active" : "disabled",
      threadCount: tag.threadCount
    };
  }

  private toAdminUserSummary(user: {
    id: string;
    email: string;
    username: string;
    role: PrismaUserRole;
    status: PrismaUserStatus;
    createdAt: Date;
    _count: { threads: number; comments: number };
  }): AdminUserSummary {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: this.toPublicUserRole(user.role),
      status: this.toPublicUserStatus(user.status),
      threadCount: user._count.threads,
      commentCount: user._count.comments,
      createdAt: user.createdAt.toISOString()
    };
  }

  private toReportSummary(report: {
    id: string;
    targetType: PrismaReportTarget;
    threadId: string | null;
    commentId: string | null;
    reporterId: string;
    reporter: { username: string };
    reason: PrismaReportReason;
    detail: string | null;
    status: PrismaReportStatus;
    createdAt: Date;
    resolvedAt: Date | null;
  }): ReportSummary {
    return {
      id: report.id,
      targetType: report.targetType === PrismaReportTarget.THREAD ? "thread" : "comment",
      targetId: report.threadId ?? report.commentId ?? "",
      reporterId: report.reporterId,
      reporterUsername: report.reporter.username,
      reason: this.toPublicReportReason(report.reason),
      detail: report.detail,
      status: this.toPublicReportStatus(report.status),
      createdAt: report.createdAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() ?? null
    };
  }

  private toAuditLogSummary(auditLog: {
    id: string;
    actorId: string;
    actor: { username: string };
    action: string;
    targetType: string;
    targetId: string;
    note: string | null;
    createdAt: Date;
  }): AuditLogSummary {
    return {
      id: auditLog.id,
      actorId: auditLog.actorId,
      actorUsername: auditLog.actor.username,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      note: auditLog.note,
      createdAt: auditLog.createdAt.toISOString()
    };
  }

  private toPrismaBoardStatus(status: BoardStatus): PrismaBoardStatus {
    return status === BoardStatus.Open ? PrismaBoardStatus.OPEN : PrismaBoardStatus.CLOSED;
  }

  private toPublicBoardStatus(status: PrismaBoardStatus): BoardStatus {
    return status === PrismaBoardStatus.OPEN ? BoardStatus.Open : BoardStatus.Closed;
  }

  private toPrismaTagStatus(status: "active" | "disabled"): PrismaTagStatus {
    return status === "active" ? PrismaTagStatus.ACTIVE : PrismaTagStatus.DISABLED;
  }

  private toPrismaUserRole(role: UserRole): PrismaUserRole {
    const roles: Record<UserRole, PrismaUserRole> = {
      [UserRole.Guest]: PrismaUserRole.USER,
      [UserRole.User]: PrismaUserRole.USER,
      [UserRole.Moderator]: PrismaUserRole.MODERATOR,
      [UserRole.Admin]: PrismaUserRole.ADMIN
    };

    return roles[role];
  }

  private toPublicUserRole(role: PrismaUserRole): UserRole {
    const roles: Record<PrismaUserRole, UserRole> = {
      [PrismaUserRole.USER]: UserRole.User,
      [PrismaUserRole.MODERATOR]: UserRole.Moderator,
      [PrismaUserRole.ADMIN]: UserRole.Admin
    };

    return roles[role];
  }

  private toPrismaUserStatus(status: UserStatus): PrismaUserStatus {
    const statuses: Record<UserStatus, PrismaUserStatus> = {
      [UserStatus.Active]: PrismaUserStatus.ACTIVE,
      [UserStatus.Muted]: PrismaUserStatus.MUTED,
      [UserStatus.Banned]: PrismaUserStatus.BANNED
    };

    return statuses[status];
  }

  private toPublicUserStatus(status: PrismaUserStatus): UserStatus {
    const statuses: Record<PrismaUserStatus, UserStatus> = {
      [PrismaUserStatus.ACTIVE]: UserStatus.Active,
      [PrismaUserStatus.MUTED]: UserStatus.Muted,
      [PrismaUserStatus.BANNED]: UserStatus.Banned
    };

    return statuses[status];
  }

  private toPublicThreadStatus(status: PrismaThreadStatus): ThreadStatus {
    const statuses: Record<PrismaThreadStatus, ThreadStatus> = {
      [PrismaThreadStatus.DRAFT]: ThreadStatus.Draft,
      [PrismaThreadStatus.PUBLISHED]: ThreadStatus.Published,
      [PrismaThreadStatus.HIDDEN]: ThreadStatus.Hidden,
      [PrismaThreadStatus.DELETED]: ThreadStatus.Deleted
    };

    return statuses[status];
  }

  private toPublicReportReason(reason: PrismaReportReason): ReportReason {
    const reasons: Record<PrismaReportReason, ReportReason> = {
      [PrismaReportReason.SPAM]: ReportReason.Spam,
      [PrismaReportReason.HARASSMENT]: ReportReason.Harassment,
      [PrismaReportReason.ILLEGAL]: ReportReason.Illegal,
      [PrismaReportReason.OTHER]: ReportReason.Other
    };

    return reasons[reason];
  }

  private toPublicReportStatus(status: PrismaReportStatus): ReportStatus {
    const statuses: Record<PrismaReportStatus, ReportStatus> = {
      [PrismaReportStatus.OPEN]: ReportStatus.Open,
      [PrismaReportStatus.RESOLVED]: ReportStatus.Resolved,
      [PrismaReportStatus.REJECTED]: ReportStatus.Rejected
    };

    return statuses[status];
  }
}
