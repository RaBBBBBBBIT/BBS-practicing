import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  createCommentSchema,
  createThreadSchema,
  type CommentSummary,
  type CreateCommentInput,
  type CreateThreadInput,
  type PublicUser,
  type ThreadDetail,
  type ThreadSummary
} from "@bbs/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../validation/zod-validation.pipe.js";
import { ThreadsService } from "./threads.service.js";

interface ThreadResponse {
  thread: ThreadSummary;
}

interface ThreadsResponse {
  threads: ThreadSummary[];
}

interface ThreadDetailResponse {
  thread: ThreadDetail;
}

interface CommentResponse {
  comment: CommentSummary;
}

@Controller("threads")
export class ThreadsController {
  constructor(@Inject(ThreadsService) private readonly threadsService: ThreadsService) {}

  @Post()
  @UseGuards(SessionGuard)
  async createThread(
    @Body(new ZodValidationPipe(createThreadSchema)) input: CreateThreadInput,
    @CurrentUser() user: PublicUser
  ): Promise<ThreadResponse> {
    return {
      thread: await this.threadsService.createThread(input, user)
    };
  }

  @Get()
  async listThreads(@Query("boardSlug") boardSlug?: string): Promise<ThreadsResponse> {
    return {
      threads: await this.threadsService.listThreads(boardSlug ? { boardSlug } : {})
    };
  }

  @Get(":id")
  async getThread(@Param("id") id: string): Promise<ThreadDetailResponse> {
    return {
      thread: await this.threadsService.getPublishedThread(id)
    };
  }

  @Post(":id/comments")
  @UseGuards(SessionGuard)
  async createComment(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createCommentSchema)) input: CreateCommentInput,
    @CurrentUser() user: PublicUser
  ): Promise<CommentResponse> {
    return {
      comment: await this.threadsService.createComment(id, input, user)
    };
  }
}
