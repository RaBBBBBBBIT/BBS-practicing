import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

const DEFAULT_DATABASE_URL = "postgresql://bbs:bbs_password@localhost:5432/bbs_dev";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      datasourceUrl: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
