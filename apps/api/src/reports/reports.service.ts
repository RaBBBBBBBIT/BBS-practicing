import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  NotificationType as PrismaNotificationType,
  ReportReason as PrismaReportReason,
  ReportStatus as PrismaReportStatus,
  ReportTarget as PrismaReportTarget
} from "@prisma/client";
import { ReportReason, ReportStatus, type CreateReportInput, type PublicUser, type ReportSummary } from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ReportsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createReport(input: CreateReportInput, reporter: PublicUser): Promise<ReportSummary> {
    const target = await this.findReportTarget(input);
    const report = await this.prisma.$transaction(async (tx) => {
      const createdReport = await tx.report.create({
        data: {
          targetType: input.targetType === "thread" ? PrismaReportTarget.THREAD : PrismaReportTarget.COMMENT,
          threadId: input.targetType === "thread" ? input.targetId : null,
          commentId: input.targetType === "comment" ? input.targetId : null,
          reporterId: reporter.id,
          reason: this.toPrismaReason(input.reason),
          detail: input.detail ?? null
        },
        include: { reporter: true }
      });

      const admins = await tx.user.findMany({
        where: {
          role: { in: ["ADMIN", "MODERATOR"] }
        },
        select: { id: true }
      });

      await tx.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: PrismaNotificationType.REPORT,
          title: "有新的举报待处理",
          body: `${reporter.username} 举报了${input.targetType === "thread" ? "主题" : "评论"}「${target.title}」。`
        }))
      });

      return createdReport;
    });

    return this.toReportSummary(report);
  }

  private async findReportTarget(input: CreateReportInput): Promise<{ title: string }> {
    if (input.targetType === "thread") {
      const thread = await this.prisma.thread.findUnique({
        where: { id: input.targetId },
        select: { title: true }
      });

      if (!thread) {
        throw new NotFoundException("Thread not found");
      }

      return thread;
    }

    const comment = await this.prisma.comment.findUnique({
      where: { id: input.targetId },
      select: { body: true }
    });

    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    return {
      title: comment.body.length > 24 ? `${comment.body.slice(0, 21)}...` : comment.body
    };
  }

  private toReportSummary(report: {
    id: string;
    targetType: PrismaReportTarget;
    threadId: string | null;
    commentId: string | null;
    reporterId: string;
    reporter: { username: string };
    reason: PrismaReportReason;
    detail: string | null;
    status: PrismaReportStatus;
    createdAt: Date;
    resolvedAt: Date | null;
  }): ReportSummary {
    return {
      id: report.id,
      targetType: report.targetType === PrismaReportTarget.THREAD ? "thread" : "comment",
      targetId: report.threadId ?? report.commentId ?? "",
      reporterId: report.reporterId,
      reporterUsername: report.reporter.username,
      reason: this.toPublicReason(report.reason),
      detail: report.detail,
      status: this.toPublicStatus(report.status),
      createdAt: report.createdAt.toISOString(),
      resolvedAt: report.resolvedAt?.toISOString() ?? null
    };
  }

  private toPrismaReason(reason: ReportReason): PrismaReportReason {
    const reasons: Record<ReportReason, PrismaReportReason> = {
      [ReportReason.Spam]: PrismaReportReason.SPAM,
      [ReportReason.Harassment]: PrismaReportReason.HARASSMENT,
      [ReportReason.Illegal]: PrismaReportReason.ILLEGAL,
      [ReportReason.Other]: PrismaReportReason.OTHER
    };

    return reasons[reason];
  }

  private toPublicReason(reason: PrismaReportReason): ReportReason {
    const reasons: Record<PrismaReportReason, ReportReason> = {
      [PrismaReportReason.SPAM]: ReportReason.Spam,
      [PrismaReportReason.HARASSMENT]: ReportReason.Harassment,
      [PrismaReportReason.ILLEGAL]: ReportReason.Illegal,
      [PrismaReportReason.OTHER]: ReportReason.Other
    };

    return reasons[reason];
  }

  private toPublicStatus(status: PrismaReportStatus): ReportStatus {
    const statuses: Record<PrismaReportStatus, ReportStatus> = {
      [PrismaReportStatus.OPEN]: ReportStatus.Open,
      [PrismaReportStatus.RESOLVED]: ReportStatus.Resolved,
      [PrismaReportStatus.REJECTED]: ReportStatus.Rejected
    };

    return statuses[status];
  }
}
