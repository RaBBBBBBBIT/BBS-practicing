import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service.js";

export interface RequestWithUser extends Request {
  cookies: Record<string, string | undefined>;
  user?: Awaited<ReturnType<AuthService["findUserBySessionToken"]>>;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = request.cookies?.[this.cookieName()];
    const user = await this.authService.findUserBySessionToken(token);

    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }

    request.user = user;
    return true;
  }

  private cookieName(): string {
    return process.env.SESSION_COOKIE_NAME ?? "bbs_session";
  }
}
