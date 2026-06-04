import { Controller, Get, Inject, Param, Patch, UseGuards } from "@nestjs/common";
import type { NotificationSummary, PublicUser } from "@bbs/shared";
import { CurrentUser } from "../auth/current-user.decorator.js";
import { SessionGuard } from "../auth/session.guard.js";
import { NotificationsService } from "./notifications.service.js";

interface NotificationsResponse {
  notifications: NotificationSummary[];
}

interface NotificationResponse {
  notification: NotificationSummary;
}

interface MarkAllReadResponse {
  updatedCount: number;
}

@Controller("notifications")
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly notificationsService: NotificationsService) {}

  @Get()
  async listNotifications(@CurrentUser() user: PublicUser): Promise<NotificationsResponse> {
    return {
      notifications: await this.notificationsService.listNotifications(user)
    };
  }

  @Patch("read-all")
  async markAllAsRead(@CurrentUser() user: PublicUser): Promise<MarkAllReadResponse> {
    return {
      updatedCount: await this.notificationsService.markAllAsRead(user)
    };
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string, @CurrentUser() user: PublicUser): Promise<NotificationResponse> {
    return {
      notification: await this.notificationsService.markAsRead(id, user)
    };
  }
}
