import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { UserRole as PrismaUserRole, UserStatus as PrismaUserStatus } from "@prisma/client";
import { UserRole, UserStatus, type UserProfileSummary } from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listUsers(): Promise<UserProfileSummary[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
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

    return users.map((user) => this.toProfileSummary(user));
  }

  async getUserProfile(username: string): Promise<UserProfileSummary> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
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

    return this.toProfileSummary(user);
  }

  private toProfileSummary(user: {
    id: string;
    username: string;
    role: PrismaUserRole;
    status: PrismaUserStatus;
    createdAt: Date;
    _count: { threads: number; comments: number; followers: number; following: number };
  }): UserProfileSummary {
    return {
      id: user.id,
      username: user.username,
      role: this.toPublicRole(user.role),
      status: this.toPublicStatus(user.status),
      threadCount: user._count.threads,
      commentCount: user._count.comments,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      viewerIsFollowing: false,
      createdAt: user.createdAt.toISOString()
    };
  }

  private toPublicRole(role: PrismaUserRole): UserRole {
    const roles: Record<PrismaUserRole, UserRole> = {
      [PrismaUserRole.USER]: UserRole.User,
      [PrismaUserRole.MODERATOR]: UserRole.Moderator,
      [PrismaUserRole.ADMIN]: UserRole.Admin
    };

    return roles[role];
  }

  private toPublicStatus(status: PrismaUserStatus): UserStatus {
    const statuses: Record<PrismaUserStatus, UserStatus> = {
      [PrismaUserStatus.ACTIVE]: UserStatus.Active,
      [PrismaUserStatus.MUTED]: UserStatus.Muted,
      [PrismaUserStatus.BANNED]: UserStatus.Banned
    };

    return statuses[status];
  }
}
