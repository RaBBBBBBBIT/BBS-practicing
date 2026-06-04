import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { UserRole } from "@bbs/shared";
import type { RequestWithUser } from "../auth/session.guard.js";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || (user.role !== UserRole.Admin && user.role !== UserRole.Moderator)) {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}
