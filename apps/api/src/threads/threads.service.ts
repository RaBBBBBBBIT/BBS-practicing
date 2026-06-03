import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { BoardStatus as PrismaBoardStatus, ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import { ThreadStatus, type CreateThreadInput, type PublicUser, type ThreadSummary } from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ThreadsService {
  constructor(private readonly prisma: PrismaService) {}

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

  async listThreads(): Promise<ThreadSummary[]> {
    const threads = await this.prisma.thread.findMany({
      where: { status: PrismaThreadStatus.PUBLISHED },
      orderBy: { createdAt: "desc" },
      include: {
        board: true,
        author: true
      }
    });

    return threads.map((thread) => this.toThreadSummary(thread));
  }

  private toThreadSummary(thread: {
    id: string;
    boardId: string;
    board: { slug: string };
    authorId: string;
    author: { username: string };
    title: string;
    body: string;
    status: PrismaThreadStatus;
    tags: string[];
    createdAt: Date;
  }): ThreadSummary {
    return {
      id: thread.id,
      boardId: thread.boardId,
      boardSlug: thread.board.slug,
      authorId: thread.authorId,
      authorUsername: thread.author.username,
      title: thread.title,
      excerpt: this.createExcerpt(thread.body),
      status: this.toPublicStatus(thread.status),
      tags: thread.tags,
      createdAt: thread.createdAt.toISOString()
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
