import { Inject, Injectable } from "@nestjs/common";
import { TagStatus as PrismaTagStatus, ThreadStatus as PrismaThreadStatus } from "@prisma/client";
import type { TagSummary } from "@bbs/shared";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class TagsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listTags(): Promise<TagSummary[]> {
    const [storedTags, groupedThreads] = await Promise.all([
      this.prisma.tag.findMany({ orderBy: { name: "asc" } }),
      this.prisma.thread.findMany({
        where: { status: PrismaThreadStatus.PUBLISHED },
        select: { tags: true }
      })
    ]);
    const counts = new Map<string, number>();

    for (const thread of groupedThreads) {
      for (const tag of thread.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    const storedNames = new Set(storedTags.map((tag) => tag.name));
    const derivedTags: TagSummary[] = Array.from(counts.entries())
      .filter(([name]) => !storedNames.has(name))
      .map(([name, threadCount]) => ({
        id: `tag_${name}`,
        name,
        description: "",
        status: "active",
        threadCount
      }));

    const tags: TagSummary[] = [
      ...storedTags.map<TagSummary>((tag) => ({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        status: tag.status === PrismaTagStatus.ACTIVE ? "active" : "disabled",
        threadCount: counts.get(tag.name) ?? tag.threadCount
      })),
      ...derivedTags
    ];

    return tags.sort((left, right) => left.name.localeCompare(right.name));
  }
}
