import { randomBytes, createHash } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import type { User } from "@prisma/client";
import { UserRole as PrismaUserRole, UserStatus as PrismaUserStatus } from "@prisma/client";
import {
  type AuthSessionResponse,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
  UserRole,
  UserStatus
} from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export interface CreatedSession {
  response: AuthSessionResponse;
  token: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterInput): Promise<CreatedSession> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }]
      }
    });

    if (existingUser) {
      throw new ConflictException("Email or username is already registered");
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash: await hash(input.password, 12),
        role: PrismaUserRole.USER,
        status: PrismaUserStatus.ACTIVE
      }
    });

    return this.createSession(user);
  }

  async login(input: LoginInput): Promise<CreatedSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.createSession(user);
  }

  async findUserBySessionToken(token: string | undefined): Promise<PublicUser | null> {
    if (!token) {
      return null;
    }

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true }
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    return this.toPublicUser(session.user);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    await this.prisma.session.deleteMany({
      where: { tokenHash: this.hashToken(token) }
    });
  }

  private async createSession(user: User): Promise<CreatedSession> {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.prisma.session.create({
      data: {
        tokenHash: this.hashToken(token),
        userId: user.id,
        expiresAt
      }
    });

    return {
      response: {
        user: this.toPublicUser(user)
      },
      token,
      expiresAt
    };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: this.toPublicRole(user.role),
      status: this.toPublicStatus(user.status),
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
