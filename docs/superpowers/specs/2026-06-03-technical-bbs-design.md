# 技术向 BBS 设计文档

日期：2026-06-03

## 背景

本项目是一个 SDD 开发课程作业，目标是实现一个代码规范、功能完整、可部署到个人服务器的技术向 BBS。社区定位为技术讨论和社区分享，不再区分“帖子”和“文章”，统一使用主题内容作为核心内容单位。

## 目标

- 使用全栈 TypeScript 构建前台、后台和后端服务。
- 使用 Docker Compose 支持本地模拟部署和个人服务器部署。
- 实现一个功能完整的技术社区：发布、评论、搜索、收藏、点赞、关注、通知、私信、举报、审核和后台管理。
- 保持工程结构清晰，便于课程展示、答辩说明和后期扩展。
- 预留移动端接入空间，后期可以新增独立移动端而不重写后端。

## 非目标

- 第一版不开发独立移动端 App。
- 第一版不区分帖子和文章两种内容模型。
- 第一版不接入 Elasticsearch 等独立搜索引擎，优先使用 PostgreSQL 全文检索。
- 第一版不做群聊私信，只做用户间一对一私信。

## 端划分

项目包含两个可见端和一个服务层：

- 用户前台：面向普通用户和游客，提供浏览、搜索、发布、评论、互动、通知、私信、个人主页和设置能力。前台 PC 优先，并做响应式移动端适配。
- 管理后台：面向版主和管理员，提供内容审核、举报处理、用户管理、分区管理、标签管理和审计日志能力。
- 后端服务：提供统一 API、鉴权、业务逻辑、上传、通知、搜索和后台治理能力。

## 技术方案

采用 Monorepo 方案：

- `apps/web`：Next.js 用户前台。
- `apps/admin`：Next.js 管理后台。
- `apps/api`：NestJS 后端服务。
- `packages/shared`：共享 DTO、类型、枚举、校验 schema 和常量。
- `packages/ui`：前台和后台可复用的 Web UI 组件。
- `packages/eslint-config`：统一 ESLint 配置。
- `packages/tsconfig`：统一 TypeScript 配置。

核心依赖：

- TypeScript：全项目主语言。
- Next.js：前台和后台 Web 应用。
- NestJS：后端 API 服务。
- Prisma：数据库 schema、migration 和类型安全查询。
- PostgreSQL：主数据库和全文检索。
- Redis：会话、缓存、限流和异步任务辅助。
- MinIO：本地和服务器上的对象存储，用于图片和附件。
- Nginx：生产环境反向代理。
- Docker Compose：本地服务编排和服务器部署。
- pnpm workspace + Turborepo：Monorepo 包管理和任务编排。

## 根目录结构

```txt
BBS-practicing/
├── apps/
│   ├── web/
│   ├── admin/
│   └── api/
├── packages/
│   ├── shared/
│   ├── ui/
│   ├── eslint-config/
│   └── tsconfig/
├── infra/
│   ├── nginx/
│   ├── docker/
│   └── scripts/
├── docs/
│   ├── superpowers/
│   │   └── specs/
│   ├── design/
│   ├── api/
│   ├── database/
│   └── deployment/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── tsconfig.base.json
├── README.md
└── .gitignore
```

Prisma 放在 `apps/api/prisma/`。数据库模型主要服务后端，共享给前端的类型通过 API DTO 和 `packages/shared` 暴露。

## 本地开发启动方式

日常开发使用本机 Node 进程运行前后端，基础设施服务使用 Docker：

```bash
pnpm install
docker compose up -d postgres redis minio
pnpm dev
```

默认端口：

- 用户前台：`http://localhost:3000`
- 管理后台：`http://localhost:3001`
- 后端 API：`http://localhost:4000`

模拟部署时使用完整容器化启动：

```bash
docker compose up --build
```

根目录脚本规划：

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "pnpm --filter web dev",
    "dev:admin": "pnpm --filter admin dev",
    "dev:api": "pnpm --filter api start:dev",
    "db:migrate": "pnpm --filter api prisma migrate dev",
    "db:seed": "pnpm --filter api prisma db seed",
    "lint": "turbo lint",
    "test": "turbo test",
    "build": "turbo build"
  }
}
```

## 前台页面

- 首页：展示最新主题、热门主题、推荐分区和标签入口。
- 分区页：展示指定分区下的主题列表，支持排序和筛选。
- 主题详情页：展示主题正文、评论、楼中楼回复、点赞、收藏、举报和管理操作入口。
- 发布与编辑页：支持 Markdown、代码高亮、图片上传、标签选择和草稿保存。
- 搜索结果页：支持按关键词搜索主题、用户、标签和分区。
- 通知页：展示评论、回复、点赞、关注、审核结果等站内通知。
- 个人主页：展示用户资料、发布历史、评论历史、收藏和关注。
- 设置页：管理个人资料、密码和通知偏好。

## 后台页面

- 仪表盘：展示用户数、主题数、评论数、举报数和近期审核记录。
- 内容审核：管理隐藏、恢复、锁定、置顶和删除主题或评论。
- 举报处理：查看举报详情，处理违规内容和记录处理结果。
- 用户管理：查看用户状态，执行封禁、解封、角色调整。
- 分区管理：创建、编辑、排序和关闭分区。
- 标签管理：创建、合并、禁用和清理标签。

## 核心数据对象

- `User`：用户基础信息、角色、状态和资料。
- `Board`：板块或分区。
- `Thread`：统一内容单位，承载技术讨论和社区分享。
- `Comment`：评论和楼中楼回复。
- `Tag`：主题标签。
- `Reaction`：点赞或顶一下。
- `Bookmark`：收藏。
- `Follow`：关注用户或分区。
- `Notification`：站内通知。
- `Conversation`：一对一私信会话。
- `Message`：私信消息。
- `Report`：举报记录。
- `Attachment`：图片和附件。
- `AuditLog`：审核、封禁、解封、置顶、锁定等后台操作记录。

热榜、推荐和统计优先作为派生数据，不在第一版设计为复杂主表。

## 权限模型

采用 RBAC：

- 游客：浏览、搜索和查看详情。
- 普通用户：发布主题、评论、回复、点赞、收藏、关注、举报、发送私信和管理自己的内容。
- 版主：在授权分区内置顶、锁定、隐藏内容、处理举报。
- 管理员：管理全站用户、分区、标签、审核、系统配置和审计日志。

用户状态：

- `active`：正常。
- `muted`：禁言，不能发布主题、评论或私信。
- `banned`：封禁，不能登录或执行用户操作。

内容生命周期状态：

- `draft`：草稿。
- `published`：已发布。
- `hidden`：隐藏，仅作者、版主和管理员可见。
- `deleted`：删除，不在普通列表中显示。

内容管理标记：

- `isPinned`：是否置顶，可用于分区置顶或全站置顶。
- `isLocked`：是否锁定，锁定后普通用户不能继续评论。

## 关键流程

注册登录：

1. 用户注册账号。
2. 后端校验邮箱、用户名和密码强度。
3. 密码哈希后写入数据库。
4. 登录成功后设置 HttpOnly Cookie 会话。
5. 前台根据会话获取当前用户和权限。

发布主题：

1. 用户进入发布页。
2. 选择分区、填写标题、正文和标签。
3. 上传图片或附件时通过 API 写入 MinIO，并记录 `Attachment`。
4. 保存草稿或发布主题。
5. 发布后更新搜索索引字段和计数。

评论和楼中楼：

1. 用户在主题详情页发表评论。
2. 评论可直接挂在主题下，也可通过 `parentId` 回复另一条评论。
3. 被回复用户收到站内通知。
4. 锁定主题不允许普通用户新增评论。

举报和审核：

1. 用户举报主题、评论或私信。
2. 系统生成 `Report`。
3. 版主或管理员在后台处理。
4. 处理动作写入 `AuditLog`。
5. 被处理用户收到审核结果通知。

私信：

1. 用户从个人主页或私信入口发起一对一会话。
2. 系统复用已有双方会话或创建新会话。
3. 消息写入 `Message`。
4. 接收方收到站内通知。
5. 禁言或封禁用户不能发送私信。

## API 设计原则

- API 由 NestJS 统一提供，前台、后台和未来移动端共用。
- 请求和响应 DTO 放在 `packages/shared` 或由 API 模块导出，避免前后端类型漂移。
- 管理后台接口与普通用户接口分组，后台接口必须经过角色和权限校验。
- 写操作统一做鉴权、参数校验、业务权限校验和审计记录。
- 上传接口只负责文件接收和元数据记录，业务内容通过 `Attachment` 关联文件。

## 搜索方案

第一版使用 PostgreSQL 全文检索：

- 主题标题、正文摘要、标签和作者昵称进入搜索范围。
- 搜索结果支持按相关度、发布时间、热度排序。
- 后端提供统一搜索接口。
- 后期如果数据量增长，可以替换为 Elasticsearch 或 Meilisearch，不改变前端搜索页面结构。

## 部署方案

开发环境：

- 本机运行 `web`、`admin` 和 `api`。
- Docker 运行 PostgreSQL、Redis 和 MinIO。

生产环境：

- Docker Compose 运行 `web`、`admin`、`api`、`postgres`、`redis`、`minio` 和 `nginx`。
- Nginx 根据域名或路径转发到前台、后台和 API。
- `.env.example` 记录所有必要环境变量。
- `infra/scripts` 提供数据库初始化、备份和部署辅助脚本。

## 移动端扩展

第一版不开发移动端，但保留后期扩展路径：

- 后期新增 `apps/mobile`，优先使用 React Native 或 Expo。
- 移动端调用同一套 NestJS API。
- DTO、枚举、权限和校验 schema 继续复用 `packages/shared`。
- Web 使用 HttpOnly Cookie 会话，移动端后期可新增 token 登录方式。
- 通知模型先做站内通知，后期可扩展移动端推送。
- 移动端独立实现 UI，不强行复用 Web UI 组件。

## 测试策略

- 后端服务：为认证、权限、主题、评论、举报和审核模块写单元测试。
- API 集成测试：覆盖注册登录、发布主题、评论、搜索、举报处理和后台权限。
- 前端测试：覆盖关键表单、登录状态、权限可见性和页面渲染。
- E2E 测试：覆盖用户注册登录、发布主题、评论、收藏、举报和管理员处理举报。
- 构建检查：`pnpm lint`、`pnpm test`、`pnpm build` 作为交付前验证命令。

## 设计取舍

- 选择 Next.js + NestJS 的 Monorepo，而不是单体 Next.js，是为了让前端、后台、后端边界更清楚，便于课程展示和后期扩展。
- 不区分帖子和文章，是为了降低内容模型复杂度，让技术讨论和技术分享都统一落在 `Thread` 上。
- 第一版使用 PostgreSQL 全文检索，是为了减少基础设施复杂度，同时保留后期替换搜索引擎的空间。
- Web 与移动端共享 API 和类型，不共享 UI，是为了避免跨平台 UI 复用带来的实现负担。
