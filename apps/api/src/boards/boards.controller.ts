import { Controller, Get } from "@nestjs/common";
import type { BoardSummary } from "@bbs/shared";
import { BoardsService } from "./boards.service.js";

interface BoardsResponse {
  boards: BoardSummary[];
}

@Controller("boards")
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async listBoards(): Promise<BoardsResponse> {
    return {
      boards: await this.boardsService.listBoards()
    };
  }
}
