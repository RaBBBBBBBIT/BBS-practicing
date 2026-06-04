import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { AdminController } from "../src/admin/admin.controller.js";
import { AdminService } from "../src/admin/admin.service.js";
import { AuthController } from "../src/auth/auth.controller.js";
import { AuthService } from "../src/auth/auth.service.js";
import { SessionGuard } from "../src/auth/session.guard.js";
import { BoardsController } from "../src/boards/boards.controller.js";
import { BoardsService } from "../src/boards/boards.service.js";
import { InteractionsController } from "../src/interactions/interactions.controller.js";
import { InteractionsService } from "../src/interactions/interactions.service.js";
import { MessagesController } from "../src/messages/messages.controller.js";
import { MessagesService } from "../src/messages/messages.service.js";
import { NotificationsController } from "../src/notifications/notifications.controller.js";
import { NotificationsService } from "../src/notifications/notifications.service.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
import { ReportsController } from "../src/reports/reports.controller.js";
import { ReportsService } from "../src/reports/reports.service.js";
import { ThreadsController } from "../src/threads/threads.controller.js";
import { ThreadsService } from "../src/threads/threads.service.js";

const SELF_DECLARED_DEPS_METADATA = "self:paramtypes";

interface ExplicitDependency {
  index: number;
  param: unknown;
}

const dependencies = [
  { target: AuthController, dependency: AuthService },
  { target: AuthService, dependency: PrismaService },
  { target: SessionGuard, dependency: AuthService },
  { target: BoardsController, dependency: BoardsService },
  { target: BoardsService, dependency: PrismaService },
  { target: ThreadsController, dependency: ThreadsService },
  { target: ThreadsService, dependency: PrismaService },
  { target: InteractionsController, dependency: InteractionsService },
  { target: InteractionsService, dependency: PrismaService },
  { target: NotificationsController, dependency: NotificationsService },
  { target: NotificationsService, dependency: PrismaService },
  { target: MessagesController, dependency: MessagesService },
  { target: MessagesService, dependency: PrismaService },
  { target: ReportsController, dependency: ReportsService },
  { target: ReportsService, dependency: PrismaService },
  { target: AdminController, dependency: AdminService },
  { target: AdminService, dependency: PrismaService }
];

describe("Nest dependency injection metadata", () => {
  it.each(dependencies)("$target.name declares explicit constructor injection", ({ target, dependency }) => {
    const explicitDependencies =
      (Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, target) as ExplicitDependency[] | undefined) ?? [];

    expect(explicitDependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          index: 0,
          param: dependency
        })
      ])
    );
  });
});
