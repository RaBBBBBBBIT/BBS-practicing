import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BoardStatus as PrismaBoardStatus, ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import {
  ThreadStatus,
  type CommentSummary,
  type CreateCommentInput,
  type CreateThreadInput,
  type ListThreadsQuery,
  type ModerationActionInput,
  type PublicUser,
  type ThreadDetail,
  type ThreadSummary,
  type UpdateThreadInput,
  UserRole
} from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ThreadsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createThread(input: CreateThreadInput, author: PublicUser): Promise<ThreadSummary> {
    const board = await this.prisma.board.findUnique({
      where: { id: input.boardId }
    });

    if (!board) {
      throw new NotFoundException("Board not found");
    }

    if (board.status !== PrismaBoardStatus.OPEN) {
      throw new BadRequestException("Board is closed");
    }

    const thread = await this.prisma.thread.create({
      data: {
        boardId: input.boardId,
        authorId: author.id,
        title: input.title,
        body: input.body,
        tags: input.tags
      },
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

    return this.toThreadSummary(thread);
  }

  async listThreads(options: ListThreadsQuery): Promise<ThreadSummary[]> {
    const status = options.status ? this.toPrismaStatus(options.status) : PrismaThreadStatus.PUBLISHED;
    const threads = await this.prisma.thread.findMany({
      where: {
        status,
        ...(options.boardSlug ? { board: { slug: options.boardSlug } } : {}),
        ...(options.tag ? { tags: { has: options.tag } } : {}),
        ...(options.q
          ? {
              OR: [
                { title: { contains: options.q, mode: "insensitive" } },
                { body: { contains: options.q, mode: "insensitive" } },
                { author: { username: { contains: options.q, mode: "insensitive" } } }
              ]
            }
          : {})
      },
      orderBy: this.toThreadOrderBy(options.sort),
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

  async updateThread(threadId: string, input: UpdateThreadInput, user: PublicUser): Promise<ThreadDetail> {
    const existingThread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { authorId: true }
    });

    if (!existingThread) {
      throw new NotFoundException("Thread not found");
    }

    if (existingThread.authorId !== user.id && !this.canModerate(user)) {
      throw new ForbiddenException("You cannot edit this thread");
    }

    await this.prisma.thread.update({
      where: { id: threadId },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.body ? { body: input.body } : {}),
        ...(input.tags ? { tags: input.tags } : {})
      }
    });

    return this.getThreadForManagement(threadId);
  }

  async moderateThread(threadId: string, input: ModerationActionInput, user: PublicUser): Promise<ThreadDetail> {
    if (!this.canModerate(user)) {
      throw new ForbiddenException("You cannot moderate threads");
    }

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
          actorId: user.id,
          action: input.action,
          targetType: "thread",
          targetId: threadId,
          note: input.note ?? null
        }
      })
    ]);

    return this.getThreadForManagement(threadId);
  }

  async getPublishedThread(id: string): Promise<ThreadDetail> {
    const thread = await this.prisma.thread.findFirst({
      where: {
        id,
        status: PrismaThreadStatus.PUBLISHED
      },
      include: {
        board: true,
        author: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
            bookmarks: true
          }
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            author: true
          }
        }
      }
    });

    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    return this.toThreadDetail(thread);
  }

  async createComment(threadId: string, input: CreateCommentInput, author: PublicUser): Promise<CommentSummary> {
    const comment = await this.prisma.$transaction(async (tx) => {
      const thread = await tx.thread.findFirst({
        where: {
          id: threadId,
          status: PrismaThreadStatus.PUBLISHED
        },
        select: { id: true }
      });

      if (!thread) {
        throw new NotFoundException("Thread not found");
      }

      const createdComment = await tx.comment.create({
        data: {
          threadId: thread.id,
          authorId: author.id,
          parentId: null,
          body: input.body
        },
        include: {
          author: true
        }
      });

      await tx.thread.update({
        where: { id: thread.id },
        data: { updatedAt: new Date() }
      });

      return createdComment;
    });

    return this.toCommentSummary(comment);
  }

  private async getThreadForManagement(id: string): Promise<ThreadDetail> {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      include: {
        board: true,
        author: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
            bookmarks: true
          }
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            author: true
          }
        }
      }
    });

    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    return this.toThreadDetail(thread);
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
      excerpt: this.createExcerpt(thread.body),
      status: this.toPublicStatus(thread.status),
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

  private toThreadDetail(thread: {
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
    comments: Array<{
      id: string;
      threadId: string;
      authorId: string;
      author: { username: string };
      parentId: string | null;
      body: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): ThreadDetail {
    return {
      id: thread.id,
      boardId: thread.boardId,
      boardSlug: thread.board.slug,
      boardName: thread.board.name,
      authorId: thread.authorId,
      authorUsername: thread.author.username,
      title: thread.title,
      body: thread.body,
      status: this.toPublicStatus(thread.status),
      tags: thread.tags,
      commentCount: thread._count.comments,
      reactionCount: thread._count.reactions,
      bookmarkCount: thread._count.bookmarks,
      viewCount: thread.viewCount,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      viewerHasReacted: false,
      viewerHasBookmarked: false,
      comments: thread.comments.map((comment) => this.toCommentSummary(comment)),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString()
    };
  }

  private toCommentSummary(comment: {
    id: string;
    threadId: string;
    authorId: string;
    author: { username: string };
    parentId: string | null;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  }): CommentSummary {
    return {
      id: comment.id,
      threadId: comment.threadId,
      authorId: comment.authorId,
      authorUsername: comment.author.username,
      parentId: comment.parentId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    };
  }

  private createExcerpt(body: string): string {
    return body.length > 160 ? `${body.slice(0, 157)}...` : body;
  }

  private toPublicStatus(status: PrismaThreadStatus): ThreadStatus {
    const statuses: Record<PrismaThreadStatus, ThreadStatus> = {
      [PrismaThreadStatus.DRAFT]: ThreadStatus.Draft,
      [PrismaThreadStatus.PUBLISHED]: ThreadStatus.Published,
      [PrismaThreadStatus.HIDDEN]: ThreadStatus.Hidden,
      [PrismaThreadStatus.DELETED]: ThreadStatus.Deleted
    };

    return statuses[status];
  }

  private toPrismaStatus(status: ThreadStatus): PrismaThreadStatus {
    const statuses: Record<ThreadStatus, PrismaThreadStatus> = {
      [ThreadStatus.Draft]: PrismaThreadStatus.DRAFT,
      [ThreadStatus.Published]: PrismaThreadStatus.PUBLISHED,
      [ThreadStatus.Hidden]: PrismaThreadStatus.HIDDEN,
      [ThreadStatus.Deleted]: PrismaThreadStatus.DELETED
    };

    return statuses[status];
  }

  private toThreadOrderBy(sort: ListThreadsQuery["sort"]): Array<Record<string, "asc" | "desc">> {
    if (sort === "oldest") {
      return [{ createdAt: "asc" }];
    }

    if (sort === "popular") {
      return [{ viewCount: "desc" }, { createdAt: "desc" }];
    }

    if (sort === "latest") {
      return [{ createdAt: "desc" }];
    }

    return [{ isPinned: "desc" }, { updatedAt: "desc" }, { createdAt: "desc" }];
  }

  private canModerate(user: PublicUser): boolean {
    return user.role === UserRole.Admin || user.role === UserRole.Moderator;
  }
}
