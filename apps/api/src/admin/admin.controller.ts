import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  createBoardAdminSchema,
  createTagAdminSchema,
  moderationActionSchema,
  resolveReportSchema,
  updateBoardAdminSchema,
  updateTagAdminSchema,
  updateUserAdminSchema,
  type AdminDashboardSummary,
  type AdminUserSummary,
  type AuditLogSummary,
  type BoardSummary,
  type CreateBoardAdminInput,
  type CreateTagAdminInput,
  type ModerationActionInput,
  type PublicUser,
  type ReportSummary,
  type ResolveReportInput,
  type TagSummary,
  type ThreadDetail,
  type ThreadSummary,
  type UpdateBoardAdminInput,
  type UpdateTagAdminInput,
  type UpdateUserAdminInput
} from "@bbs/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../validation/zod-validation.pipe.js";
import { AdminGuard } from "./admin.guard.js";
import { AdminService } from "./admin.service.js";

interface DashboardResponse {
  dashboard: AdminDashboardSummary;
  auditLogs: AuditLogSummary[];
}

interface ReportsResponse {
  reports: ReportSummary[];
}

interface ReportResponse {
  report: ReportSummary;
}

interface AdminUserResponse {
  user: AdminUserSummary;
}

interface BoardsResponse {
  boards: BoardSummary[];
}

interface BoardResponse {
  board: BoardSummary;
}

interface TagsResponse {
  tags: TagSummary[];
}

interface TagResponse {
  tag: TagSummary;
}

interface ThreadsResponse {
  threads: ThreadSummary[];
}

interface ThreadResponse {
  thread: ThreadDetail;
}

@Controller("admin")
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Get("dashboard")
  async getDashboard(): Promise<DashboardResponse> {
    return this.adminService.getDashboard();
  }

  @Get("reports")
  async listReports(): Promise<ReportsResponse> {
    return {
      reports: await this.adminService.listReports()
    };
  }

  @Patch("reports/:id")
  async updateReport(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(resolveReportSchema)) input: ResolveReportInput,
    @CurrentUser() user: PublicUser
  ): Promise<ReportResponse> {
    return {
      report: await this.adminService.updateReport(id, input, user)
    };
  }

  @Patch("users/:id")
  async updateUser(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUserAdminSchema)) input: UpdateUserAdminInput,
    @CurrentUser() user: PublicUser
  ): Promise<AdminUserResponse> {
    return {
      user: await this.adminService.updateUser(id, input, user)
    };
  }

  @Get("users")
  async listUsers(): Promise<{ users: AdminUserSummary[] }> {
    return {
      users: await this.adminService.listUsers()
    };
  }

  @Get("boards")
  async listBoards(): Promise<BoardsResponse> {
    return {
      boards: await this.adminService.listBoards()
    };
  }

  @Post("boards")
  async createBoard(
    @Body(new ZodValidationPipe(createBoardAdminSchema)) input: CreateBoardAdminInput,
    @CurrentUser() user: PublicUser
  ): Promise<BoardResponse> {
    return {
      board: await this.adminService.createBoard(input, user)
    };
  }

  @Patch("boards/:id")
  async updateBoard(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBoardAdminSchema)) input: UpdateBoardAdminInput,
    @CurrentUser() user: PublicUser
  ): Promise<BoardResponse> {
    return {
      board: await this.adminService.updateBoard(id, input, user)
    };
  }

  @Get("tags")
  async listTags(): Promise<TagsResponse> {
    return {
      tags: await this.adminService.listTags()
    };
  }

  @Post("tags")
  async createTag(
    @Body(new ZodValidationPipe(createTagAdminSchema)) input: CreateTagAdminInput,
    @CurrentUser() user: PublicUser
  ): Promise<TagResponse> {
    return {
      tag: await this.adminService.createTag(input, user)
    };
  }

  @Patch("tags/:id")
  async updateTag(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTagAdminSchema)) input: UpdateTagAdminInput,
    @CurrentUser() user: PublicUser
  ): Promise<TagResponse> {
    return {
      tag: await this.adminService.updateTag(id, input, user)
    };
  }

  @Get("threads")
  async listThreads(): Promise<ThreadsResponse> {
    return {
      threads: await this.adminService.listThreads()
    };
  }

  @Post("threads/:id/moderation")
  async moderateThread(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(moderationActionSchema)) input: ModerationActionInput,
    @CurrentUser() user: PublicUser
  ): Promise<ThreadResponse> {
    return {
      thread: await this.adminService.moderateThread(id, input, user)
    };
  }
}
