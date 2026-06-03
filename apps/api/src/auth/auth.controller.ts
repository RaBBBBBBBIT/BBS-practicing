import { Body, Controller, Get, HttpCode, Inject, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { loginSchema, registerSchema, type AuthSessionResponse, type LoginInput, type RegisterInput } from "@bbs/shared";
import { ZodValidationPipe } from "../validation/zod-validation.pipe.js";
import { AuthService, type CreatedSession } from "./auth.service.js";
import { SessionGuard } from "./session.guard.js";
import { CurrentUser } from "./current-user.decorator.js";
import type { PublicUser } from "@bbs/shared";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionResponse> {
    return this.sendSession(await this.authService.register(input), response);
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionResponse> {
    return this.sendSession(await this.authService.login(input), response);
  }

  @Get("me")
  @UseGuards(SessionGuard)
  getCurrentUser(@CurrentUser() user: PublicUser): AuthSessionResponse {
    return { user };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Body() _body: unknown, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = response.req?.cookies?.[this.cookieName()];
    await this.authService.logout(token);
    response.clearCookie(this.cookieName(), this.cookieOptions());
  }

  private sendSession(session: CreatedSession, response: Response): AuthSessionResponse {
    response.cookie(this.cookieName(), session.token, {
      ...this.cookieOptions(),
      expires: session.expiresAt
    });

    return session.response;
  }

  private cookieName(): string {
    return process.env.SESSION_COOKIE_NAME ?? "bbs_session";
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/"
    };
  }
}
