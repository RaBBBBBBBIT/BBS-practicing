import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { createReportSchema, type CreateReportInput, type PublicUser, type ReportSummary } from "@bbs/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { ZodValidationPipe } from "../validation/zod-validation.pipe.js";
import { ReportsService } from "./reports.service.js";

interface ReportResponse {
  report: ReportSummary;
}

@Controller("reports")
@UseGuards(SessionGuard)
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(
    @Body(new ZodValidationPipe(createReportSchema)) input: CreateReportInput,
    @CurrentUser() user: PublicUser
  ): Promise<ReportResponse> {
    return {
      report: await this.reportsService.createReport(input, user)
    };
  }
}
