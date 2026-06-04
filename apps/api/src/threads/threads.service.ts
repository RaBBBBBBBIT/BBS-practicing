import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BoardStatus as PrismaBoardStatus, ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import {
  ThreadStatus,
  type CommentSummary,
  type CreateCommentInput,
  type CreateThreadInput,
  type PublicUser,
  type ThreadDetail,
  type ThreadSummary
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

  async listThreads(options: { boardSlug?: string } = {}): Promise<ThreadSummary[]> {
    const threads = await this.prisma.thread.findMany({
      where: {
        status: PrismaThreadStatus.PUBLISHED,
        ...(options.boardSlug ? { board: { slug: options.boardSlug } } : {})
      },
      orderBy: { createdAt: "desc" },
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
}
