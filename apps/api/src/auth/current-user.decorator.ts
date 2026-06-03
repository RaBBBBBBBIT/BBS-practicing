import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { PublicUser } from "@bbs/shared";
import type { RequestWithUser } from "./session.guard.js";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): PublicUser => {
  const request = context.switchToHttp().getRequest<RequestWithUser>();
  return request.user as PublicUser;
});
