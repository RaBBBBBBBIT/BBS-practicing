import {
  BoardStatus,
  NotificationType,
  PrismaClient,
  ReportReason,
  ReportStatus,
  ReportTarget,
  TagStatus,
  ThreadStatus,
  UserRole,
  UserStatus
} from "@prisma/client";

const prisma = new PrismaClient();

const passwordHash = "$2b$10$szPXVqoXxNXqgcLv.ZxeJuri34bOP3pDUP7Jhe3LgqxvHv32X9MJ.";

const users = [
  { id: "demo_user_admin", email: "admin@example.com", username: "admin_demo", role: UserRole.ADMIN },
  { id: "demo_user_alice", email: "alice@example.com", username: "alice_demo", role: UserRole.USER },
  { id: "demo_user_bob", email: "bob@example.com", username: "bob_demo", role: UserRole.MODERATOR }
];

const boards = [
  {
    id: "demo_board_frontend",
    slug: "frontend",
    name: "前端开发",
    description: "讨论 React、Next.js、CSS 和前端工程化。"
  },
  {
    id: "demo_board_backend",
    slug: "backend",
    name: "后端开发",
    description: "讨论 NestJS、数据库、API 设计和服务端工程。"
  },
  {
    id: "demo_board_runtime_config",
    slug: "runtime-config",
    name: "运行时配置",
    description: "验证 API 开发服务缺省使用本地 PostgreSQL。"
  },
  {
    id: "demo_board_devops",
    slug: "devops",
    name: "部署运维",
    description: "讨论 Docker、CI/CD、服务器和可观测性。"
  }
];

const tags = [
  { id: "demo_tag_nextjs", name: "nextjs", description: "Next.js 页面和数据加载", threadCount: 1 },
  { id: "demo_tag_nestjs", name: "nestjs", description: "NestJS API 和模块设计", threadCount: 1 },
  { id: "demo_tag_docker", name: "docker", description: "Docker 和 Compose 本地服务", threadCount: 1 },
  { id: "demo_tag_postgresql", name: "postgresql", description: "PostgreSQL 和 Prisma 数据库", threadCount: 1 },
  { id: "demo_tag_auth", name: "auth", description: "登录、会话和权限", threadCount: 1 }
];

const threads = [
  {
    id: "demo_thread_frontend_nextjs",
    boardSlug: "frontend",
    authorEmail: "alice@example.com",
    title: "Next.js 页面数据加载实践",
    body: "这里记录一个前台页面接入论坛 API 的实践：先整理 view model，再把错误态和空状态放进页面结构里，方便后续扩展。",
    tags: ["nextjs", "react", "frontend"],
    viewCount: 128,
    isPinned: false,
    isLocked: false
  },
  {
    id: "demo_thread_backend_auth",
    boardSlug: "backend",
    authorEmail: "bob@example.com",
    title: "HttpOnly Cookie 登录流程怎么设计更稳妥？",
    body: "当前登录接口会创建服务端会话，并通过 HttpOnly Cookie 返回给浏览器。这个帖子用来讨论过期时间、退出登录和 /me 校验的边界。",
    tags: ["nestjs", "auth", "api"],
    viewCount: 96,
    isPinned: true,
    isLocked: false
  },
  {
    id: "demo_thread_runtime_config",
    boardSlug: "runtime-config",
    authorEmail: "admin@example.com",
    title: "本地开发环境默认数据库说明",
    body: "API 开发服务默认连接 postgresql://bbs:bbs_password@localhost:5432/bbs_dev。启动 Docker 依赖后，可以直接运行迁移、种子和演示数据脚本。",
    tags: ["postgresql", "prisma", "local-dev"],
    viewCount: 64,
    isPinned: false,
    isLocked: false
  },
  {
    id: "demo_thread_devops_compose",
    boardSlug: "devops",
    authorEmail: "alice@example.com",
    title: "Docker Compose 依赖服务启动清单",
    body: "本项目本地依赖包括 PostgreSQL、Redis 和 MinIO。建议先确认容器健康，再启动 API 与 Web 前台。",
    tags: ["docker", "compose", "devops"],
    viewCount: 184,
    isPinned: false,
    isLocked: false
  }
];

const comments = [
  {
    id: "demo_comment_frontend_1",
    threadId: "demo_thread_frontend_nextjs",
    authorEmail: "bob@example.com",
    body: "把 API 返回值先整理成页面需要的 view model，这个思路后面加分页也比较顺。"
  },
  {
    id: "demo_comment_backend_1",
    threadId: "demo_thread_backend_auth",
    authorEmail: "admin@example.com",
    body: "可以优先保证 Cookie 的 HttpOnly、SameSite 和过期清理，再考虑刷新会话。"
  },
  {
    id: "demo_comment_runtime_1",
    threadId: "demo_thread_runtime_config",
    authorEmail: "alice@example.com",
    body: "这个说明适合放进 README 的验收步骤里，新同学拉项目会轻松很多。"
  },
  {
    id: "demo_comment_devops_1",
    threadId: "demo_thread_devops_compose",
    authorEmail: "bob@example.com",
    body: "启动前看一下 3000 和 4000 端口占用，可以少踩一些本地调试问题。"
  }
];

async function main() {
  const userByEmail = new Map<string, { id: string }>();
  const boardBySlug = new Map<string, { id: string }>();

  for (const user of users) {
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        username: user.username,
        passwordHash,
        role: user.role,
        status: UserStatus.ACTIVE
      },
      create: {
        ...user,
        passwordHash,
        status: UserStatus.ACTIVE
      }
    });
    userByEmail.set(user.email, savedUser);
  }

  for (const board of boards) {
    const savedBoard = await prisma.board.upsert({
      where: { slug: board.slug },
      update: {
        name: board.name,
        description: board.description,
        status: BoardStatus.OPEN
      },
      create: {
        ...board,
        status: BoardStatus.OPEN
      }
    });
    boardBySlug.set(board.slug, savedBoard);
  }

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: {
        description: tag.description,
        status: TagStatus.ACTIVE,
        threadCount: tag.threadCount
      },
      create: {
        ...tag,
        status: TagStatus.ACTIVE
      }
    });
  }

  for (const thread of threads) {
    const boardId = requireMapValue(boardBySlug, thread.boardSlug);
    const authorId = requireMapValue(userByEmail, thread.authorEmail);

    await prisma.thread.upsert({
      where: { id: thread.id },
      update: {
        boardId,
        authorId,
        title: thread.title,
        body: thread.body,
        tags: thread.tags,
        viewCount: thread.viewCount,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        status: ThreadStatus.PUBLISHED
      },
      create: {
        id: thread.id,
        boardId,
        authorId,
        title: thread.title,
        body: thread.body,
        tags: thread.tags,
        viewCount: thread.viewCount,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        status: ThreadStatus.PUBLISHED
      }
    });
  }

  for (const comment of comments) {
    const authorId = requireMapValue(userByEmail, comment.authorEmail);

    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {
        threadId: comment.threadId,
        authorId,
        parentId: null,
        body: comment.body
      },
      create: {
        id: comment.id,
        threadId: comment.threadId,
        authorId,
        body: comment.body,
        parentId: null
      }
    });
  }

  const adminId = requireMapValue(userByEmail, "admin@example.com");
  const aliceId = requireMapValue(userByEmail, "alice@example.com");
  const bobId = requireMapValue(userByEmail, "bob@example.com");

  await prisma.reaction.upsert({
    where: { threadId_userId: { threadId: "demo_thread_devops_compose", userId: bobId } },
    update: {},
    create: { threadId: "demo_thread_devops_compose", userId: bobId }
  });
  await prisma.bookmark.upsert({
    where: { threadId_userId: { threadId: "demo_thread_backend_auth", userId: aliceId } },
    update: {},
    create: { threadId: "demo_thread_backend_auth", userId: aliceId }
  });
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: aliceId, followingId: bobId } },
    update: {},
    create: { followerId: aliceId, followingId: bobId }
  });

  await prisma.notification.upsert({
    where: { id: "demo_notification_comment" },
    update: {
      userId: aliceId,
      type: NotificationType.COMMENT,
      title: "有新的评论",
      body: "bob_demo 评论了你的 Docker Compose 主题。",
      isRead: false
    },
    create: {
      id: "demo_notification_comment",
      userId: aliceId,
      type: NotificationType.COMMENT,
      title: "有新的评论",
      body: "bob_demo 评论了你的 Docker Compose 主题。"
    }
  });

  const conversation = await prisma.conversation.upsert({
    where: { userAId_userBId: { userAId: aliceId, userBId: bobId } },
    update: {},
    create: {
      id: "demo_conversation_alice_bob",
      userAId: aliceId,
      userBId: bobId
    }
  });
  await prisma.message.upsert({
    where: { id: "demo_message_alice_bob_1" },
    update: {
      conversationId: conversation.id,
      senderId: aliceId,
      body: "我把 Docker Compose 清单整理好了，你帮忙看下后台说明。"
    },
    create: {
      id: "demo_message_alice_bob_1",
      conversationId: conversation.id,
      senderId: aliceId,
      body: "我把 Docker Compose 清单整理好了，你帮忙看下后台说明。"
    }
  });

  await prisma.report.upsert({
    where: { id: "demo_report_backend_auth" },
    update: {
      targetType: ReportTarget.THREAD,
      threadId: "demo_thread_backend_auth",
      commentId: null,
      reporterId: aliceId,
      reason: ReportReason.OTHER,
      detail: "演示后台举报处理流程。",
      status: ReportStatus.OPEN,
      resolvedAt: null
    },
    create: {
      id: "demo_report_backend_auth",
      targetType: ReportTarget.THREAD,
      threadId: "demo_thread_backend_auth",
      reporterId: aliceId,
      reason: ReportReason.OTHER,
      detail: "演示后台举报处理流程。"
    }
  });

  await prisma.auditLog.upsert({
    where: { id: "demo_audit_seed" },
    update: {
      actorId: adminId,
      action: "seedDemoData",
      targetType: "system",
      targetId: "demo",
      note: "初始化完整演示数据"
    },
    create: {
      id: "demo_audit_seed",
      actorId: adminId,
      action: "seedDemoData",
      targetType: "system",
      targetId: "demo",
      note: "初始化完整演示数据"
    }
  });
}

function requireMapValue(values: Map<string, { id: string }>, key: string): string {
  const value = values.get(key);

  if (!value) {
    throw new Error(`Missing seed dependency: ${key}`);
  }

  return value.id;
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
