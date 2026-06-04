import { Controller, Get, Inject, Param } from "@nestjs/common";
import type { UserProfileSummary } from "@bbs/shared";
import { UsersService } from "./users.service.js";

interface UsersResponse {
  users: UserProfileSummary[];
}

interface UserResponse {
  user: UserProfileSummary;
}

@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  async listUsers(): Promise<UsersResponse> {
    return {
      users: await this.usersService.listUsers()
    };
  }

  @Get(":username")
  async getUserProfile(@Param("username") username: string): Promise<UserResponse> {
    return {
      user: await this.usersService.getUserProfile(username)
    };
  }
}
