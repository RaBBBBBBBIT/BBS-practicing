# BBS Practicing

一个用于 AI 开发课程作业的开发者社区项目。项目以“可运行、可演示、可追踪开发过程”为目标，使用全栈 TypeScript 搭建 GitHub Discussions / Issues 风格的 BBS 系统，包含用户前台、管理后台、后端 API、数据库迁移、初始化数据、手动 SQL、测试和中文文档。

## 功能概览

- 前台：分区浏览、主题搜索/筛选/排序、主题详情、发帖、编辑自己的主题、真实评论。
- 互动：点赞、收藏、关注作者、举报主题或评论。
- 社交：成员页、个人主页、通知页、一对一私信。
- 后台：仪表盘统计、举报处理、主题审核、用户管理、分区管理、标签管理、审计日志。
- 数据：PostgreSQL 持久化、Prisma 迁移、seed 初始化、可重复导入演示 SQL。
- 过程：`docs/superpowers/` 保留设计和实施计划，适合课程作业展示 AI 协作过程。

## 技术栈

| 类型 | 技术 |
| --- | --- |
| Monorepo | pnpm workspace, Turbo |
| 前台 | Next.js, React, TypeScript |
| 后台 | Next.js, React, TypeScript |
| 后端 | NestJS, TypeScript |
| 数据库 | PostgreSQL, Prisma |
| 会话 | HttpOnly Cookie, 服务端 Session 表 |
| 校验 | Zod |
| 测试 | Vitest, Supertest |
| 本地依赖 | Docker Compose, Redis, MinIO |

## 项目结构

```txt
BBS-practicing
├── apps
│   ├── api                    # NestJS 后端 API
│   │   ├── prisma             # schema、迁移、seed、手动 SQL
│   │   ├── src
│   │   │   ├── admin          # 后台管理 API
│   │   │   ├── auth           # 注册、登录、会话
│   │   │   ├── boards         # 分区公开接口
│   │   │   ├── interactions   # 点赞、收藏、关注
│   │   │   ├── messages       # 一对一私信
│   │   │   ├── notifications  # 站内通知
│   │   │   ├── reports        # 举报
│   │   │   ├── tags           # 标签公开接口
│   │   │   ├── threads        # 主题、评论、审核动作
│   │   │   └── users          # 成员和个人主页公开接口
│   │   └── test               # API e2e 测试
│   ├── web                    # 用户前台
│   └── admin                  # 管理后台
├── packages
│   ├── shared                 # 共享类型和 Zod schema
│   ├── ui                     # 共享 UI 包
│   ├── eslint-config
│   └── tsconfig
├── docs                       # 项目文档、设计和计划
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 快速启动

### 1. 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 2. 启动本地依赖

```bash
docker compose up -d postgres redis minio
```

默认数据库连接：

```txt
postgresql://bbs:bbs_password@localhost:5432/bbs_dev
```

### 3. 初始化数据库

```bash
pnpm db:migrate
pnpm db:seed
```

也可以导入手动演示 SQL：

```bash
docker exec -i bbs-postgres psql -U bbs -d bbs_dev -v ON_ERROR_STOP=1 < apps/api/prisma/sql/demo-data.sql
```

`pnpm db:seed` 和 `demo-data.sql` 都会写入演示用户、分区、标签、主题、评论、互动、通知、私信、举报和审计记录，可重复执行。

### 4. 启动服务

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

也可以使用：

```bash
pnpm dev
```

## 访问地址

| 服务 | 地址 |
| --- | --- |
| 用户前台 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
| API 健康检查 | http://localhost:4000/api/health |
| MinIO 控制台 | http://localhost:9001 |

## 演示账号

演示账号密码统一为：

```txt
DemoPass123!
```

| 邮箱 | 用户名 | 角色 |
| --- | --- | --- |
| `admin@example.com` | `admin_demo` | 管理员 |
| `alice@example.com` | `alice_demo` | 普通用户 |
| `bob@example.com` | `bob_demo` | 版主 |

## 页面说明

### 用户前台

| 路径 | 说明 |
| --- | --- |
| `/` | 开发者讨论工作台，支持搜索、分区、标签和排序筛选 |
| `/boards/[slug]` | 分区主题列表 |
| `/threads/[id]` | 主题详情、评论、点赞、收藏、关注、举报、作者编辑 |
| `/threads/new` | 登录后发布主题 |
| `/members` | 成员列表 |
| `/users/[username]` | 用户个人主页和私信入口 |
| `/tags` | 标签列表 |
| `/notifications` | 登录用户通知 |
| `/messages` | 登录用户私信会话 |
| `/login`、`/register` | 登录和注册 |

### 管理后台

| 路径 | 说明 |
| --- | --- |
| `/` | 仪表盘统计和近期审计 |
| `/reports` | 举报处理列表 |
| `/threads` | 主题审核列表 |
| `/users` | 用户管理列表 |
| `/boards` | 分区管理列表 |
| `/tags` | 标签管理列表 |

后台 API 使用管理员或版主权限。演示时可以先在前台登录 `admin@example.com`，再打开管理后台。

## API 摘要

统一前缀：

```txt
http://localhost:4000/api
```

| 模块 | 接口 |
| --- | --- |
| 健康检查 | `GET /health` |
| 认证 | `POST /auth/register`、`POST /auth/login`、`GET /auth/me`、`POST /auth/logout` |
| 分区 | `GET /boards` |
| 主题 | `GET /threads`、`GET /threads/:id`、`POST /threads`、`PATCH /threads/:id` |
| 评论 | `POST /threads/:id/comments` |
| 互动 | `POST/DELETE /threads/:id/reactions`、`POST/DELETE /threads/:id/bookmarks` |
| 关注 | `POST/DELETE /users/:id/follow` |
| 成员 | `GET /users`、`GET /users/:username` |
| 标签 | `GET /tags` |
| 通知 | `GET /notifications`、`PATCH /notifications/:id/read`、`PATCH /notifications/read-all` |
| 私信 | `GET /messages/conversations`、`GET /messages/conversations/:id`、`POST /messages` |
| 举报 | `POST /reports` |
| 后台 | `GET /admin/dashboard`、`GET/PATCH /admin/reports`、`GET/POST/PATCH /admin/boards`、`GET/POST/PATCH /admin/tags`、`GET/PATCH /admin/users`、`GET /admin/threads` |

## 数据库模型

核心模型：

- `User`、`Session`
- `Board`、`Thread`、`Comment`
- `Reaction`、`Bookmark`、`Follow`
- `Notification`
- `Conversation`、`Message`
- `Report`、`AuditLog`
- `Tag`

主要枚举：

- `UserRole`：`USER`、`MODERATOR`、`ADMIN`
- `UserStatus`：`ACTIVE`、`MUTED`、`BANNED`
- `BoardStatus`：`OPEN`、`CLOSED`
- `ThreadStatus`：`DRAFT`、`PUBLISHED`、`HIDDEN`、`DELETED`
- `ReportStatus`：`OPEN`、`RESOLVED`、`REJECTED`

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 构建共享包并启动所有开发服务 |
| `pnpm dev:web` | 启动用户前台 |
| `pnpm dev:admin` | 启动管理后台 |
| `pnpm dev:api` | 启动后端 API |
| `pnpm db:migrate` | 执行 Prisma 迁移 |
| `pnpm db:seed` | 写入完整演示 seed 数据 |
| `pnpm test` | 运行测试 |
| `pnpm typecheck` | 类型检查 |
| `pnpm build` | 构建项目 |
| `pnpm lint` | ESLint 检查 |

## 验收流程

命令行验收：

```bash
pnpm install --frozen-lockfile
docker compose up -d postgres redis minio
pnpm db:migrate
pnpm db:seed
docker exec -i bbs-postgres psql -U bbs -d bbs_dev -v ON_ERROR_STOP=1 < apps/api/prisma/sql/demo-data.sql
pnpm test
pnpm typecheck
pnpm build
pnpm lint
docker compose config
```

浏览器验收：

1. 打开 http://localhost:3000，确认首页展示 GitHub 风格讨论工作台。
2. 使用搜索、分区、标签、排序筛选主题。
3. 登录 `alice@example.com`，进入主题详情发表评论、点赞、收藏、关注作者、举报。
4. 打开 `/members`、`/tags`、`/notifications`、`/messages`，确认页面使用真实接口。
5. 登录 `admin@example.com`，打开 http://localhost:3001，确认仪表盘、举报、主题、用户、分区、标签页面展示真实数据。

## 文档和过程文件

项目文档统一放在 `docs/`：

```txt
docs/design                 # UI 和设计规范
docs/superpowers/specs      # 需求和设计过程文档
docs/superpowers/plans      # 实施计划文档
docs/git-standard.md        # Git 使用标准
```

因为这是 AI 开发课程作业，仓库会保留 `.superpowers/` 和 `docs/superpowers/` 等过程文件，用于展示需求分析、计划拆解和实现过程。

## SQL 文件

手动 SQL 统一放在：

```txt
apps/api/prisma/sql/
```

当前文件：

```txt
apps/api/prisma/sql/demo-data.sql
apps/api/prisma/sql/README.md
```

Prisma 自动生成的 `migration.sql` 保留在 `apps/api/prisma/migrations/`，不要移动到手动 SQL 目录，否则 Prisma 无法追踪迁移历史。

## Git 忽略说明

课程过程文件会保留并提交。`.gitignore` 主要忽略依赖、构建产物、缓存、本地环境和日志：

```txt
node_modules/
.next/
dist/
coverage/
.turbo/
*.tsbuildinfo
.env
.DS_Store
*.log
```
