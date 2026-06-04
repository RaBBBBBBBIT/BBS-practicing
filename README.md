# BBS Practicing

一个用于 AI 开发课程作业的技术论坛项目。项目以“可运行、可演示、可追踪开发过程”为目标，使用全栈 TypeScript 搭建 BBS MVP，包含前台论坛、后端 API、数据库模型、迁移、演示数据和测试验证。

## 项目概览

本项目当前实现了一个面向开发者的论坛基础流程：

- 浏览论坛分区
- 浏览最新主题
- 按分区查看主题
- 查看主题详情
- 用户注册
- 用户登录
- 登录后发布主题
- HttpOnly Cookie 会话认证
- PostgreSQL 数据持久化
- Prisma 数据库迁移
- 本地演示 SQL 数据

评论表已经在数据库模型中建立，当前 MVP 主要完成主题浏览和发帖流程，评论接口和评论前台交互可作为后续扩展。

## 技术栈

| 类型 | 技术 |
| --- | --- |
| Monorepo | pnpm workspace, Turbo |
| 前台 | Next.js, React, TypeScript |
| 后端 | NestJS, TypeScript |
| 数据库 | PostgreSQL, Prisma |
| 会话 | HttpOnly Cookie, 服务端 Session 表 |
| 校验 | Zod |
| 测试 | Vitest, Supertest |
| 本地依赖 | Docker Compose, Redis, MinIO |
| 代码规范 | ESLint, TypeScript |

Redis 和 MinIO 已纳入本地基础设施，用于后续缓存、队列、附件或资源上传等功能扩展。当前 MVP 的核心业务数据主要存储在 PostgreSQL。

## 项目结构

```txt
BBS-practicing
├── apps
│   ├── api                    # NestJS 后端 API
│   │   ├── prisma             # Prisma schema、迁移、seed、手动 SQL
│   │   ├── src
│   │   │   ├── auth           # 注册、登录、会话认证
│   │   │   ├── boards         # 论坛分区接口
│   │   │   ├── health         # 健康检查接口
│   │   │   ├── prisma         # Prisma 服务封装
│   │   │   ├── threads        # 主题创建、列表、详情
│   │   │   └── validation     # Zod 校验管道
│   │   └── test               # API 端到端测试
│   ├── web                    # 用户前台 Next.js 应用
│   │   └── src
│   │       ├── app            # 首页、分区页、主题页、登录、注册、发帖
│   │       ├── components     # 表单组件
│   │       └── lib            # API 客户端和页面 view model
│   └── admin                  # 管理后台骨架
├── packages
│   ├── shared                 # 前后端共享类型和 Zod schema
│   ├── ui                     # 共享 UI 包
│   ├── eslint-config          # 共享 ESLint 配置
│   └── tsconfig               # 共享 TypeScript 配置
├── docs                       # 项目文档、计划、规范
├── docker-compose.yml         # PostgreSQL、Redis、MinIO
├── package.json               # 根脚本
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## 环境要求

建议使用以下环境：

- Node.js 20 或更高版本
- pnpm 9.15.4
- Docker Desktop 或兼容 Docker Compose 的运行环境

项目根目录声明了包管理器版本：

```json
"packageManager": "pnpm@9.15.4"
```

如果本机没有 pnpm，可以使用 Corepack：

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## 快速启动

### 1. 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 2. 准备环境变量

项目提供了 [.env.example](./.env.example)。本地开发时可以复制一份：

```bash
cp .env.example .env
```

不复制也可以运行，因为 API 和 Prisma 脚本内置了本地开发默认值。

默认数据库连接为：

```txt
postgresql://bbs:bbs_password@localhost:5432/bbs_dev
```

### 3. 启动基础设施

```bash
docker compose up -d postgres redis minio
```

查看容器状态：

```bash
docker compose ps
```

### 4. 初始化数据库

执行 Prisma 迁移：

```bash
pnpm db:migrate
```

写入基础分区 seed：

```bash
pnpm db:seed
```

### 5. 导入演示数据

项目提供了手动 SQL 演示数据：

```bash
docker exec -i bbs-postgres psql -U bbs -d bbs_dev -v ON_ERROR_STOP=1 < apps/api/prisma/sql/demo-data.sql
```

演示 SQL 文件位置：

```txt
apps/api/prisma/sql/demo-data.sql
```

该 SQL 使用 `ON CONFLICT`，可以重复执行。它会写入演示用户、分区、主题和评论数据。

演示账号如下，密码统一为：

```txt
DemoPass123!
```

| 邮箱 | 用户名 | 角色 |
| --- | --- | --- |
| `admin@example.com` | `admin_demo` | 管理员 |
| `alice@example.com` | `alice_demo` | 普通用户 |
| `bob@example.com` | `bob_demo` | 版主 |

### 6. 启动服务

分别启动 API 和前台：

```bash
pnpm dev:api
pnpm dev:web
```

也可以使用根命令启动所有开发服务：

```bash
pnpm dev
```

管理后台可单独启动：

```bash
pnpm dev:admin
```

## 访问地址

| 服务 | 地址 |
| --- | --- |
| 用户前台 | http://localhost:3000 |
| 用户前台发帖页 | http://localhost:3000/threads/new |
| 管理后台 | http://localhost:3001 |
| API 健康检查 | http://localhost:4000/api/health |
| MinIO 控制台 | http://localhost:9001 |

MinIO 默认账号密码来自 [.env.example](./.env.example)：

```txt
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=minio_password
```

## 功能说明

### 用户前台

用户前台位于 `apps/web`，当前包含：

- `/`：论坛首页，展示分区和最新主题
- `/boards/[slug]`：分区详情和该分区主题列表
- `/threads/[id]`：主题详情
- `/login`：登录页
- `/register`：注册页
- `/threads/new`：登录后发帖页

前台通过 `apps/web/src/lib/forum-api.ts` 请求后端 API，默认 API 地址为：

```txt
http://localhost:4000/api
```

可以通过环境变量覆盖：

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### 后端 API

后端位于 `apps/api`，使用 NestJS 实现。API 默认端口是 `4000`，统一前缀为：

```txt
http://localhost:4000/api
```

已实现模块：

- `auth`：注册、登录、读取当前用户、退出登录
- `boards`：分区列表
- `threads`：主题创建、主题列表、主题详情
- `health`：健康检查
- `prisma`：数据库访问
- `validation`：请求体验证

### 数据库模型

Prisma schema 位于：

```txt
apps/api/prisma/schema.prisma
```

核心模型包括：

- `User`：用户
- `Session`：服务端会话
- `Board`：论坛分区
- `Thread`：主题
- `Comment`：评论

枚举包括：

- `UserRole`：`USER`、`MODERATOR`、`ADMIN`
- `UserStatus`：`ACTIVE`、`MUTED`、`BANNED`
- `BoardStatus`：`OPEN`、`CLOSED`
- `ThreadStatus`：`DRAFT`、`PUBLISHED`、`HIDDEN`、`DELETED`

## API 接口

### 健康检查

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/health` | 检查 API 是否运行 |

示例：

```bash
curl http://localhost:4000/api/health
```

### 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/auth/register` | 注册用户，创建会话并设置 HttpOnly Cookie |
| `POST` | `/auth/login` | 登录用户，创建会话并设置 HttpOnly Cookie |
| `GET` | `/auth/me` | 获取当前登录用户 |
| `POST` | `/auth/logout` | 删除当前会话并清除 Cookie |

注册示例：

```bash
curl -i -c /tmp/bbs-cookie.txt http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","username":"student_demo","password":"password123"}'
```

登录示例：

```bash
curl -i -c /tmp/bbs-cookie.txt http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"password123"}'
```

读取当前用户：

```bash
curl -i -b /tmp/bbs-cookie.txt http://localhost:4000/api/auth/me
```

退出登录：

```bash
curl -i -b /tmp/bbs-cookie.txt -c /tmp/bbs-cookie.txt \
  -X POST http://localhost:4000/api/auth/logout
```

### 分区

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/boards` | 获取分区列表，包含每个分区的主题数量 |

示例：

```bash
curl http://localhost:4000/api/boards
```

### 主题

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/threads` | 获取已发布主题列表 |
| `GET` | `/threads?boardSlug=<slug>` | 获取指定分区下的已发布主题 |
| `GET` | `/threads/<id>` | 获取已发布主题详情 |
| `POST` | `/threads` | 登录后创建主题 |

获取主题列表：

```bash
curl http://localhost:4000/api/threads
```

按分区获取主题：

```bash
curl "http://localhost:4000/api/threads?boardSlug=backend"
```

获取主题详情：

```bash
curl http://localhost:4000/api/threads/demo_thread_backend_auth
```

创建主题：

```bash
curl -i http://localhost:4000/api/threads \
  -H "Content-Type: application/json" \
  -b /tmp/bbs-cookie.txt \
  -d '{
    "boardId": "<board-id>",
    "title": "如何组织 NestJS 模块？",
    "body": "我想理解 provider、module 和 controller 的职责划分。",
    "tags": ["nestjs", "backend"]
  }'
```

其中 `<board-id>` 可以从 `/api/boards` 返回结果中获取。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 构建共享包并启动所有开发服务 |
| `pnpm dev:web` | 启动用户前台 |
| `pnpm dev:admin` | 启动管理后台 |
| `pnpm dev:api` | 启动后端 API |
| `pnpm db:migrate` | 执行 Prisma 迁移 |
| `pnpm db:seed` | 写入基础 seed 数据 |
| `pnpm test` | 运行测试 |
| `pnpm typecheck` | 运行类型检查 |
| `pnpm build` | 构建项目 |
| `pnpm lint` | 运行 ESLint |

API 子包还提供：

```bash
pnpm --filter api prisma:generate
pnpm --filter api prisma:validate
```

## 验收流程

### 命令行验收

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

### 运行时验收

启动 API 和前台：

```bash
pnpm dev:api
pnpm dev:web
```

检查 API：

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/boards
curl http://localhost:4000/api/threads
```

浏览器检查：

- 打开 http://localhost:3000，确认首页展示分区和演示主题。
- 点击分区，确认能进入 `/boards/<slug>`。
- 点击主题，确认能进入 `/threads/<id>` 并看到标题、作者、分区、标签和正文。
- 打开 `/register` 注册新账号，成功后进入 `/threads/new`。
- 在 `/threads/new` 选择分区、填写标题、正文和标签，发布后跳转到新主题详情页。
- 打开 `/login`，使用演示账号或新账号登录。

## 文档和开发过程

项目文档统一放在 `docs/` 目录：

```txt
docs/design                 # 设计规范
docs/superpowers/specs      # 需求和设计过程文档
docs/superpowers/plans      # 实施计划文档
docs/git-standard.md        # Git 使用标准
```

因为这是 AI 开发课程作业，仓库会保留部分 AI 协作过程文件，例如 `.superpowers/` 和 `docs/superpowers/`。这些文件用于展示需求分析、计划和实现过程。

构建产物、依赖和缓存不会提交，例如：

```txt
node_modules/
.next/
dist/
coverage/
.turbo/
*.tsbuildinfo
```

## 数据库文件说明

Prisma 迁移文件位于：

```txt
apps/api/prisma/migrations/
```

手动 SQL 文件集中放在：

```txt
apps/api/prisma/sql/
```

当前手动 SQL：

```txt
apps/api/prisma/sql/demo-data.sql
```

注意：Prisma 自动生成的 `migration.sql` 需要留在 `migrations/` 目录下，不能移动到手动 SQL 目录，否则 Prisma 会无法正确追踪迁移历史。

## 当前状态

当前项目已经完成 BBS MVP 的主要闭环：

1. 后端完成认证、分区、主题 API。
2. 前台完成首页、分区页、主题详情、登录、注册和发帖页面。
3. 数据库完成核心模型、迁移、基础 seed 和演示 SQL。
4. 测试覆盖共享 schema、API 端到端流程、前台 API 客户端、页面 view model 和主要页面状态。
5. 本地运行已通过 API、前台浏览器和命令行验证。

后续可以继续扩展：

- 评论发布和展示
- 分页和搜索
- 管理后台分区/主题管理
- 用户资料页
- 附件上传
- Redis 缓存或限流
- MinIO 资源管理
- 部署流水线
