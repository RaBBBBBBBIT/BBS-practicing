import { Controller, Delete, Inject, Param, Post, UseGuards } from "@nestjs/common";
import type { ThreadSummary, UserProfileSummary, PublicUser } from "@bbs/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { InteractionsService } from "./interactions.service.js";

interface ThreadResponse {
  thread: ThreadSummary;
}

interface UserProfileResponse {
  user: UserProfileSummary;
}

@Controller()
@UseGuards(SessionGuard)
export class InteractionsController {
  constructor(@Inject(InteractionsService) private readonly interactionsService: InteractionsService) {}

  @Post("threads/:id/reactions")
  async reactToThread(@Param("id") threadId: string, @CurrentUser() user: PublicUser): Promise<ThreadResponse> {
    return {
      thread: await this.interactionsService.reactToThread(threadId, user)
    };
  }

  @Delete("threads/:id/reactions")
  async removeThreadReaction(@Param("id") threadId: string, @CurrentUser() user: PublicUser): Promise<ThreadResponse> {
    return {
      thread: await this.interactionsService.removeThreadReaction(threadId, user)
    };
  }

  @Post("threads/:id/bookmarks")
  async bookmarkThread(@Param("id") threadId: string, @CurrentUser() user: PublicUser): Promise<ThreadResponse> {
    return {
      thread: await this.interactionsService.bookmarkThread(threadId, user)
    };
  }

  @Delete("threads/:id/bookmarks")
  async removeThreadBookmark(@Param("id") threadId: string, @CurrentUser() user: PublicUser): Promise<ThreadResponse> {
    return {
      thread: await this.interactionsService.removeThreadBookmark(threadId, user)
    };
  }

  @Post("users/:id/follow")
  async followUser(@Param("id") userId: string, @CurrentUser() user: PublicUser): Promise<UserProfileResponse> {
    return {
      user: await this.interactionsService.followUser(userId, user)
    };
  }

  @Delete("users/:id/follow")
  async unfollowUser(@Param("id") userId: string, @CurrentUser() user: PublicUser): Promise<UserProfileResponse> {
    return {
      user: await this.interactionsService.unfollowUser(userId, user)
    };
  }
}
