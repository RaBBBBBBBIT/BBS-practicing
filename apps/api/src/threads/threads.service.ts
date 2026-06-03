import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BoardStatus as PrismaBoardStatus, ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import { ThreadStatus, type CreateThreadInput, type PublicUser, type ThreadDetail, type ThreadSummary } from "@bbs/shared";
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
        author: true
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
        author: true
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
        author: true
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
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString()
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
