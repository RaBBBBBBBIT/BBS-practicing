import { Body, Controller, Get, Inject, Post, UseGuards } from "@nestjs/common";
import { createThreadSchema, type CreateThreadInput, type PublicUser, type ThreadSummary } from "@bbs/shared";
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
  async listThreads(): Promise<ThreadsResponse> {
    return {
      threads: await this.threadsService.listThreads()
    };
  }
}
