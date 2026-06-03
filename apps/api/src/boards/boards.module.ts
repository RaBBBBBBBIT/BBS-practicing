import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { BoardsController } from "./boards.controller.js";
import { BoardsService } from "./boards.service.js";

@Module({
  imports: [PrismaModule],
  controllers: [BoardsController],
  providers: [BoardsService]
})
export class BoardsModule {}
