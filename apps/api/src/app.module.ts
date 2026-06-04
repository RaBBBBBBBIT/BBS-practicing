import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { BoardsModule } from "./boards/boards.module.js";
import { HealthModule } from "./health/health.module.js";
import { InteractionsModule } from "./interactions/interactions.module.js";
import { MessagesModule } from "./messages/messages.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ReportsModule } from "./reports/reports.module.js";
import { ThreadsModule } from "./threads/threads.module.js";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    BoardsModule,
    ThreadsModule,
    InteractionsModule,
    NotificationsModule,
    MessagesModule,
    ReportsModule
  ]
})
export class AppModule {}
