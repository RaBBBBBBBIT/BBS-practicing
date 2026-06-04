import { Controller, Get, Inject } from "@nestjs/common";
import type { TagSummary } from "@bbs/shared";
import { TagsService } from "./tags.service.js";

interface TagsResponse {
  tags: TagSummary[];
}

@Controller("tags")
export class TagsController {
  constructor(@Inject(TagsService) private readonly tagsService: TagsService) {}

  @Get()
  async listTags(): Promise<TagsResponse> {
    return {
      tags: await this.tagsService.listTags()
    };
  }
}
