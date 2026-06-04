import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType as PrismaNotificationType } from "@prisma/client";
import type { NotificationSummary, PublicUser } from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class NotificationsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listNotifications(user: PublicUser): Promise<NotificationSummary[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    return notifications.map((notification) => this.toNotificationSummary(notification));
  }

  async markAsRead(notificationId: string, user: PublicUser): Promise<NotificationSummary> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id
      }
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return this.toNotificationSummary(updatedNotification);
  }

  async markAllAsRead(user: PublicUser): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    return result.count;
  }

  private toNotificationSummary(notification: {
    id: string;
    type: PrismaNotificationType;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: Date;
  }): NotificationSummary {
    return {
      id: notification.id,
      type: this.toPublicType(notification.type),
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString()
    };
  }

  private toPublicType(type: PrismaNotificationType): NotificationSummary["type"] {
    const types: Record<PrismaNotificationType, NotificationSummary["type"]> = {
      [PrismaNotificationType.COMMENT]: "comment",
      [PrismaNotificationType.REACTION]: "reaction",
      [PrismaNotificationType.FOLLOW]: "follow",
      [PrismaNotificationType.REPORT]: "report",
      [PrismaNotificationType.MODERATION]: "moderation",
      [PrismaNotificationType.MESSAGE]: "message"
    };

    return types[type];
  }
}
