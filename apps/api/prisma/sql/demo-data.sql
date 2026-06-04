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

INSERT INTO "Thread" ("id", "boardId", "authorId", "title", "body", "status", "tags", "createdAt", "updatedAt")
VALUES
  (
    'demo_thread_frontend_nextjs',
    (SELECT "id" FROM "Board" WHERE "slug" = 'frontend'),
    (SELECT "id" FROM "User" WHERE "email" = 'alice@example.com'),
    'Next.js 页面数据加载实践',
    '这里记录一个前台页面接入论坛 API 的实践：先整理 view model，再把错误态和空状态放进页面结构里，方便后续扩展。',
    'PUBLISHED',
    ARRAY['nextjs', 'react', 'frontend']::TEXT[],
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

COMMIT;
