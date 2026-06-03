import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { BoardsModule } from "./boards/boards.module.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ThreadsModule } from "./threads/threads.module.js";

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, BoardsModule, ThreadsModule]
})
export class AppModule {}
