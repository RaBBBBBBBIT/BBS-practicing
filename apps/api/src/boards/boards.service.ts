import { Injectable } from "@nestjs/common";
import { BoardStatus as PrismaBoardStatus } from "@prisma/client";
import { BoardStatus, type BoardSummary } from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBoards(): Promise<BoardSummary[]> {
    const boards = await this.prisma.board.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { threads: true }
        }
      }
    });

    return boards.map((board) => ({
      id: board.id,
      slug: board.slug,
      name: board.name,
      description: board.description,
      status: this.toPublicStatus(board.status),
      threadCount: board._count.threads
    }));
  }

  private toPublicStatus(status: PrismaBoardStatus): BoardStatus {
    const statuses: Record<PrismaBoardStatus, BoardStatus> = {
      [PrismaBoardStatus.OPEN]: BoardStatus.Open,
      [PrismaBoardStatus.CLOSED]: BoardStatus.Closed
    };

    return statuses[status];
  }
}
