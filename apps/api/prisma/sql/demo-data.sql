-- Demo data for the local BBS development database.
-- Usage:
--   psql "postgresql://bbs:bbs_password@localhost:5432/bbs_dev" -f apps/api/prisma/sql/demo-data.sql
--
-- Demo login accounts all use the password: DemoPass123!

BEGIN;

INSERT INTO "User" ("id", "email", "username", "passwordHash", "role", "status", "createdAt", "updatedAt")
VALUES
  (
    'demo_user_admin',
    'admin@example.com',
    'admin_demo',
    '$2b$10$szPXVqoXxNXqgcLv.ZxeJuri34bOP3pDUP7Jhe3LgqxvHv32X9MJ.',
    'ADMIN',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'demo_user_alice',
    'alice@example.com',
    'alice_demo',
    '$2b$10$szPXVqoXxNXqgcLv.ZxeJuri34bOP3pDUP7Jhe3LgqxvHv32X9MJ.',
    'USER',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'demo_user_bob',
    'bob@example.com',
    'bob_demo',
    '$2b$10$szPXVqoXxNXqgcLv.ZxeJuri34bOP3pDUP7Jhe3LgqxvHv32X9MJ.',
    'MODERATOR',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("email") DO UPDATE SET
  "username" = EXCLUDED."username",
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = EXCLUDED."role",
  "status" = EXCLUDED."status",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Board" ("id", "slug", "name", "description", "status", "createdAt", "updatedAt")
VALUES
  (
    'demo_board_frontend',
    'frontend',
    '前端开发',
    '讨论 React、Next.js、CSS 和前端工程化。',
    'OPEN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'demo_board_backend',
    'backend',
    '后端开发',
    '讨论 NestJS、数据库、API 设计和服务端工程。',
    'OPEN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'demo_board_runtime_config',
    'runtime-config',
    '运行时配置',
    '验证 API 开发服务缺省使用本地 PostgreSQL。',
    'OPEN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'demo_board_devops',
    'devops',
    '部署运维',
    '讨论 Docker、CI/CD、服务器和可观测性。',
    'OPEN',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Tag" ("id", "name", "description", "status", "threadCount", "createdAt", "updatedAt")
VALUES
  ('demo_tag_nextjs', 'nextjs', 'Next.js 页面和数据加载', 'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo_tag_nestjs', 'nestjs', 'NestJS API 和模块设计', 'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo_tag_docker', 'docker', 'Docker 和 Compose 本地服务', 'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo_tag_postgresql', 'postgresql', 'PostgreSQL 和 Prisma 数据库', 'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('demo_tag_auth', 'auth', '登录、会话和权限', 'ACTIVE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "threadCount" = EXCLUDED."threadCount",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Thread" ("id", "boardId", "authorId", "title", "body", "status", "tags", "isPinned", "isLocked", "viewCount", "createdAt", "updatedAt")
VALUES
  (
    'demo_thread_frontend_nextjs',
    (SELECT "id" FROM "Board" WHERE "slug" = 'frontend'),
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    'Next.js 页面数据加载实践',
    '这里记录一个前台页面接入论坛 API 的实践：先整理 view model，再把错误态和空状态放进页面结构里，方便后续扩展。',
    'PUBLISHED',
    ARRAY['nextjs', 'react', 'frontend']::TEXT[],
    false,
    false,
    128,
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days'
  ),
  (
    'demo_thread_backend_auth',
    (SELECT "id" FROM "Board" WHERE "slug" = 'backend'),
    (SELECT "id" FROM "User" WHERE "email" = 'bob@example.com'),
    'HttpOnly Cookie 登录流程怎么设计更稳妥？',
    '当前登录接口会创建服务端会话，并通过 HttpOnly Cookie 返回给浏览器。这个帖子用来讨论过期时间、退出登录和 /me 校验的边界。',
    'PUBLISHED',
    ARRAY['nestjs', 'auth', 'api']::TEXT[],
    true,
    false,
    96,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
  ),
  (
    'demo_thread_runtime_config',
    (SELECT "id" FROM "Board" WHERE "slug" = 'runtime-config'),
    (SELECT "id" FROM "User" WHERE "email" = 'admin@example.com'),
    '本地开发环境默认数据库说明',
    'API 开发服务默认连接 postgresql://bbs:bbs_password@localhost:5432/bbs_dev。启动 Docker 依赖后，可以直接运行迁移、种子和演示数据脚本。',
    'PUBLISHED',
    ARRAY['postgresql', 'prisma', 'local-dev']::TEXT[],
    false,
    false,
    64,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  ),
  (
    'demo_thread_devops_compose',
    (SELECT "id" FROM "Board" WHERE "slug" = 'devops'),
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    'Docker Compose 依赖服务启动清单',
    '本项目本地依赖包括 PostgreSQL、Redis 和 MinIO。建议先确认容器健康，再启动 API 与 Web 前台。',
    'PUBLISHED',
    ARRAY['docker', 'compose', 'devops']::TEXT[],
    false,
    false,
    184,
    CURRENT_TIMESTAMP - INTERVAL '6 hours',
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
  )
ON CONFLICT ("id") DO UPDATE SET
  "boardId" = EXCLUDED."boardId",
  "authorId" = EXCLUDED."authorId",
  "title" = EXCLUDED."title",
  "body" = EXCLUDED."body",
  "status" = EXCLUDED."status",
  "tags" = EXCLUDED."tags",
  "isPinned" = EXCLUDED."isPinned",
  "isLocked" = EXCLUDED."isLocked",
  "viewCount" = EXCLUDED."viewCount",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Comment" ("id", "threadId", "authorId", "parentId", "body", "createdAt", "updatedAt")
VALUES
  (
    'demo_comment_frontend_1',
    'demo_thread_frontend_nextjs',
    (SELECT "id" FROM "User" WHERE "email" = 'bob@example.com'),
    NULL,
    '把 API 返回值先整理成页面需要的 view model，这个思路后面加分页也比较顺。',
    CURRENT_TIMESTAMP - INTERVAL '2 days 20 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 days 20 hours'
  ),
  (
    'demo_comment_backend_1',
    'demo_thread_backend_auth',
    (SELECT "id" FROM "User" WHERE "email" = 'admin@example.com'),
    NULL,
    '可以优先保证 Cookie 的 HttpOnly、SameSite 和过期清理，再考虑刷新会话。',
    CURRENT_TIMESTAMP - INTERVAL '1 day 18 hours',
    CURRENT_TIMESTAMP - INTERVAL '1 day 18 hours'
  ),
  (
    'demo_comment_runtime_1',
    'demo_thread_runtime_config',
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    NULL,
    '这个说明适合放进 README 的验收步骤里，新同学拉项目会轻松很多。',
    CURRENT_TIMESTAMP - INTERVAL '20 hours',
    CURRENT_TIMESTAMP - INTERVAL '20 hours'
  ),
  (
    'demo_comment_devops_1',
    'demo_thread_devops_compose',
    (SELECT "id" FROM "User" WHERE "email" = 'bob@example.com'),
    NULL,
    '启动前看一下 3000 和 4000 端口占用，可以少踩一些本地调试问题。',
    CURRENT_TIMESTAMP - INTERVAL '4 hours',
    CURRENT_TIMESTAMP - INTERVAL '4 hours'
  )
ON CONFLICT ("id") DO UPDATE SET
  "threadId" = EXCLUDED."threadId",
  "authorId" = EXCLUDED."authorId",
  "parentId" = EXCLUDED."parentId",
  "body" = EXCLUDED."body",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Reaction" ("id", "threadId", "userId", "createdAt")
VALUES
  (
    'demo_reaction_devops_bob',
    'demo_thread_devops_compose',
    (SELECT "id" FROM "User" WHERE "email" = 'bob@example.com'),
    CURRENT_TIMESTAMP - INTERVAL '3 hours'
  )
ON CONFLICT ("threadId", "userId") DO NOTHING;

INSERT INTO "Bookmark" ("id", "threadId", "userId", "createdAt")
VALUES
  (
    'demo_bookmark_backend_alice',
    'demo_thread_backend_auth',
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  )
ON CONFLICT ("threadId", "userId") DO NOTHING;

INSERT INTO "Follow" ("id", "followerId", "followingId", "createdAt")
VALUES
  (
    'demo_follow_alice_bob',
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    (SELECT "id" FROM "User" WHERE "email" = 'bob@example.com'),
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  )
ON CONFLICT ("followerId", "followingId") DO NOTHING;

INSERT INTO "Notification" ("id", "userId", "type", "title", "body", "isRead", "createdAt")
VALUES
  (
    'demo_notification_comment',
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    'COMMENT',
    '有新的评论',
    'bob_demo 评论了你的 Docker Compose 主题。',
    false,
    CURRENT_TIMESTAMP - INTERVAL '3 hours'
  )
ON CONFLICT ("id") DO UPDATE SET
  "userId" = EXCLUDED."userId",
  "type" = EXCLUDED."type",
  "title" = EXCLUDED."title",
  "body" = EXCLUDED."body",
  "isRead" = EXCLUDED."isRead";

INSERT INTO "Conversation" ("id", "userAId", "userBId", "createdAt", "updatedAt")
VALUES
  (
    'demo_conversation_alice_bob',
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    (SELECT "id" FROM "User" WHERE "email" = 'bob@example.com'),
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  )
ON CONFLICT ("userAId", "userBId") DO UPDATE SET
  "updatedAt" = CURRENT_TIMESTAMP - INTERVAL '1 day';

INSERT INTO "Message" ("id", "conversationId", "senderId", "body", "createdAt")
VALUES
  (
    'demo_message_alice_bob_1',
    (
      SELECT "id"
      FROM "Conversation"
      WHERE "userAId" = (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com')
        AND "userBId" = (SELECT "id" FROM "User" WHERE "email" = 'bob@example.com')
    ),
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    '我把 Docker Compose 清单整理好了，你帮忙看下后台说明。',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
  )
ON CONFLICT ("id") DO UPDATE SET
  "conversationId" = EXCLUDED."conversationId",
  "senderId" = EXCLUDED."senderId",
  "body" = EXCLUDED."body";

INSERT INTO "Report" ("id", "targetType", "threadId", "commentId", "reporterId", "reason", "detail", "status", "resolvedAt", "createdAt", "updatedAt")
VALUES
  (
    'demo_report_backend_auth',
    'THREAD',
    'demo_thread_backend_auth',
    NULL,
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    'OTHER',
    '演示后台举报处理流程。',
    'OPEN',
    NULL,
    CURRENT_TIMESTAMP - INTERVAL '12 hours',
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
  )
ON CONFLICT ("id") DO UPDATE SET
  "targetType" = EXCLUDED."targetType",
  "threadId" = EXCLUDED."threadId",
  "commentId" = EXCLUDED."commentId",
  "reporterId" = EXCLUDED."reporterId",
  "reason" = EXCLUDED."reason",
  "detail" = EXCLUDED."detail",
  "status" = EXCLUDED."status",
  "resolvedAt" = EXCLUDED."resolvedAt",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "AuditLog" ("id", "actorId", "action", "targetType", "targetId", "note", "createdAt")
VALUES
  (
    'demo_audit_seed',
    (SELECT "id" FROM "User" WHERE "email" = 'admin@example.com'),
    'seedDemoData',
    'system',
    'demo',
    '初始化完整演示数据',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE SET
  "actorId" = EXCLUDED."actorId",
  "action" = EXCLUDED."action",
  "targetType" = EXCLUDED."targetType",
  "targetId" = EXCLUDED."targetId",
  "note" = EXCLUDED."note";

COMMIT;
