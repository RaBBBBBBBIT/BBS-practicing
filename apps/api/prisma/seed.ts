import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const boards = [
  {
    slug: "frontend",
    name: "前端开发",
    description: "讨论 React、Next.js、CSS 和前端工程化。"
  },
  {
    slug: "backend",
    name: "后端开发",
    description: "讨论 NestJS、数据库、API 设计和服务端工程。"
  },
  {
    slug: "devops",
    name: "部署运维",
    description: "讨论 Docker、CI/CD、服务器和可观测性。"
  }
];

async function main() {
  for (const board of boards) {
    await prisma.board.upsert({
      where: { slug: board.slug },
      update: board,
      create: board
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
