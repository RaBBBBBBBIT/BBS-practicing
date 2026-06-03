import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { ThreadsController } from "./threads.controller.js";
import { ThreadsService } from "./threads.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ThreadsController],
  providers: [ThreadsService]
})
export class ThreadsModule {}
