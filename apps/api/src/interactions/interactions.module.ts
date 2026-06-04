import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { InteractionsController } from "./interactions.controller.js";
import { InteractionsService } from "./interactions.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InteractionsController],
  providers: [InteractionsService]
})
export class InteractionsModule {}
