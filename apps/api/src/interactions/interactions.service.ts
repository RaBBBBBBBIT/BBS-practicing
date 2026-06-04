import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  NotificationType as PrismaNotificationType,
  ThreadStatus as PrismaThreadStatus,
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus
} from "@prisma/client";
import { ThreadStatus, UserRole, UserStatus, type PublicUser, type ThreadSummary, type UserProfileSummary } from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class InteractionsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async reactToThread(threadId: string, user: PublicUser): Promise<ThreadSummary> {
    const thread = await this.getPublishedThreadIdentity(threadId);

    await this.prisma.$transaction(async (tx) => {
      const reaction = await tx.reaction.upsert({
        where: { threadId_userId: { threadId, userId: user.id } },
        create: { threadId, userId: user.id },
        update: {}
      });

      if (thread.authorId !== user.id && reaction.createdAt.getTime() > Date.now() - 5000) {
        await tx.notification.create({
          data: {
            userId: thread.authorId,
            type: PrismaNotificationType.REACTION,
            title: "你的讨论收到了点赞",
            body: `${user.username} 点赞了「${thread.title}」。`
          }
        });
      }
    });

    return this.getThreadSummaryForViewer(threadId, user.id);
  }

  async removeThreadReaction(threadId: string, user: PublicUser): Promise<ThreadSummary> {
    await this.getPublishedThreadIdentity(threadId);
    await this.prisma.reaction.deleteMany({
      where: {
        threadId,
        userId: user.id
      }
    });

    return this.getThreadSummaryForViewer(threadId, user.id);
  }

  async bookmarkThread(threadId: string, user: PublicUser): Promise<ThreadSummary> {
    await this.getPublishedThreadIdentity(threadId);
    await this.prisma.bookmark.upsert({
      where: { threadId_userId: { threadId, userId: user.id } },
      create: { threadId, userId: user.id },
      update: {}
    });

    return this.getThreadSummaryForViewer(threadId, user.id);
  }

  async removeThreadBookmark(threadId: string, user: PublicUser): Promise<ThreadSummary> {
    await this.getPublishedThreadIdentity(threadId);
    await this.prisma.bookmark.deleteMany({
      where: {
        threadId,
        userId: user.id
      }
    });

    return this.getThreadSummaryForViewer(threadId, user.id);
  }

  async followUser(targetUserId: string, user: PublicUser): Promise<UserProfileSummary> {
    if (targetUserId === user.id) {
      throw new BadRequestException("You cannot follow yourself");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.$transaction(async (tx) => {
      const follow = await tx.follow.upsert({
        where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
        create: { followerId: user.id, followingId: targetUserId },
        update: {}
      });

      if (follow.createdAt.getTime() > Date.now() - 5000) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            type: PrismaNotificationType.FOLLOW,
            title: "你有新的关注者",
            body: `${user.username} 关注了你。`
          }
        });
      }
    });

    return this.getUserProfileForViewer(targetUserId, user.id);
  }

  async unfollowUser(targetUserId: string, user: PublicUser): Promise<UserProfileSummary> {
    await this.prisma.follow.deleteMany({
      where: {
        followerId: user.id,
        followingId: targetUserId
      }
    });

    return this.getUserProfileForViewer(targetUserId, user.id);
  }

  private async getPublishedThreadIdentity(threadId: string): Promise<{ id: string; title: string; authorId: string }> {
    const thread = await this.prisma.thread.findFirst({
      where: {
        id: threadId,
        status: PrismaThreadStatus.PUBLISHED
      },
      select: {
        id: true,
        title: true,
        authorId: true
      }
    });

    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    return thread;
  }

  private async getThreadSummaryForViewer(threadId: string, viewerId: string): Promise<ThreadSummary> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        board: true,
        author: true,
        reactions: {
          where: { userId: viewerId },
          select: { id: true }
        },
        bookmarks: {
          where: { userId: viewerId },
          select: { id: true }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
            bookmarks: true
          }
        }
      }
    });

    if (!thread) {
      throw new NotFoundException("Thread not found");
    }

    return {
      id: thread.id,
      boardId: thread.boardId,
      boardSlug: thread.board.slug,
      boardName: thread.board.name,
      authorId: thread.authorId,
      authorUsername: thread.author.username,
      title: thread.title,
      excerpt: this.createExcerpt(thread.body),
      status: this.toPublicThreadStatus(thread.status),
      tags: thread.tags,
      commentCount: thread._count.comments,
      reactionCount: thread._count.reactions,
      bookmarkCount: thread._count.bookmarks,
      viewCount: thread.viewCount,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      viewerHasReacted: thread.reactions.length > 0,
      viewerHasBookmarked: thread.bookmarks.length > 0,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString()
    };
  }

  private async getUserProfileForViewer(userId: string, viewerId: string): Promise<UserProfileSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        followers: {
          where: { followerId: viewerId },
          select: { id: true }
        },
        _count: {
          select: {
            threads: true,
            comments: true,
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      role: this.toPublicUserRole(user.role),
      status: this.toPublicUserStatus(user.status),
      threadCount: user._count.threads,
      commentCount: user._count.comments,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      viewerIsFollowing: user.followers.length > 0,
      createdAt: user.createdAt.toISOString()
    };
  }

  private createExcerpt(body: string): string {
    return body.length > 160 ? `${body.slice(0, 157)}...` : body;
  }

  private toPublicThreadStatus(status: PrismaThreadStatus): ThreadStatus {
    const statuses: Record<PrismaThreadStatus, ThreadStatus> = {
      [PrismaThreadStatus.DRAFT]: ThreadStatus.Draft,
      [PrismaThreadStatus.PUBLISHED]: ThreadStatus.Published,
      [PrismaThreadStatus.HIDDEN]: ThreadStatus.Hidden,
      [PrismaThreadStatus.DELETED]: ThreadStatus.Deleted
    };

    return statuses[status];
  }

  private toPublicUserRole(role: PrismaUserRole): UserRole {
    const roles: Record<PrismaUserRole, UserRole> = {
      [PrismaUserRole.USER]: UserRole.User,
      [PrismaUserRole.MODERATOR]: UserRole.Moderator,
      [PrismaUserRole.ADMIN]: UserRole.Admin
    };

    return roles[role];
  }

  private toPublicUserStatus(status: PrismaUserStatus): UserStatus {
    const statuses: Record<PrismaUserStatus, UserStatus> = {
      [PrismaUserStatus.ACTIVE]: UserStatus.Active,
      [PrismaUserStatus.MUTED]: UserStatus.Muted,
      [PrismaUserStatus.BANNED]: UserStatus.Banned
    };

    return statuses[status];
  }
}
