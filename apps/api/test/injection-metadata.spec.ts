import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { AuthController } from "../src/auth/auth.controller.js";
import { AuthService } from "../src/auth/auth.service.js";
import { SessionGuard } from "../src/auth/session.guard.js";
import { BoardsController } from "../src/boards/boards.controller.js";
import { BoardsService } from "../src/boards/boards.service.js";
import { PrismaService } from "../src/prisma/prisma.service.js";
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
  { target: ThreadsService, dependency: PrismaService }
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
