import { Controller, Get, Inject } from "@nestjs/common";
import type { BoardSummary } from "@bbs/shared";
import { BoardsService } from "./boards.service.js";

interface BoardsResponse {
  boards: BoardSummary[];
}

@Controller("boards")
export class BoardsController {
  constructor(@Inject(BoardsService) private readonly boardsService: BoardsService) {}

  @Get()
  async listBoards(): Promise<BoardsResponse> {
    return {
      boards: await this.boardsService.listBoards()
    };
  }
}
