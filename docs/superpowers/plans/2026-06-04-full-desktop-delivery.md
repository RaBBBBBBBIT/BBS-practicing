# 桌面端完整交付实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不开发移动端 App 的前提下，补齐设计文档中的桌面端 BBS 交付能力，并提供完整项目说明、数据库初始化和演示数据。

**Architecture:** 先扩展 Prisma schema 和 `@bbs/shared` 契约，再按业务域实现 NestJS API，最后接入 Next.js 前台和后台页面。搜索、互动、通知、私信、举报、审核和后台管理都使用真实数据库记录，不再保留只有外观没有行为的主要入口。

**Tech Stack:** TypeScript, NestJS, Prisma, PostgreSQL, Next.js, React, Vitest, Supertest, Zod, pnpm workspace.

---

## Task 1: 数据库和共享契约

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_full_desktop_delivery/migration.sql`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`

- [x] 写失败测试：新增搜索输入、互动 DTO、通知 DTO、私信 DTO、举报 DTO、后台 DTO。
- [x] 扩展 Prisma 模型：`Reaction`、`Bookmark`、`Follow`、`Notification`、`Conversation`、`Message`、`Report`、`AuditLog`、`Tag`，并扩展 `Thread` 状态字段。
- [x] 生成 migration，确保现有数据可迁移。
- [x] 实现 shared schema 和 DTO。
- [x] 运行 `pnpm --filter @bbs/shared test`、`pnpm --filter @bbs/shared build`、`pnpm --filter api prisma:validate`。
- [x] 提交：`数据：扩展社区业务模型`。

## Task 2: 搜索、筛选和主题管理 API

**Files:**
- Modify: `apps/api/src/threads/threads.controller.ts`
- Modify: `apps/api/src/threads/threads.service.ts`
- Modify: `apps/api/test/threads.e2e-spec.ts`

- [x] 写失败 e2e：关键词、标签、状态、排序筛选。
- [x] 写失败 e2e：作者编辑自己的主题。
- [x] 写失败 e2e：管理员隐藏、恢复、置顶、锁定主题。
- [x] 实现查询参数 schema、服务查询和管理操作。
- [x] 运行 API threads e2e、typecheck、build、lint。
- [x] 提交：`功能：补齐主题搜索和管理`。

## Task 3: 互动、关注、通知、私信、举报 API

**Files:**
- Create: `apps/api/src/interactions/*`
- Create: `apps/api/src/notifications/*`
- Create: `apps/api/src/messages/*`
- Create: `apps/api/src/reports/*`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/test/interactions.e2e-spec.ts`
- Create: `apps/api/test/notifications.e2e-spec.ts`
- Create: `apps/api/test/messages.e2e-spec.ts`
- Create: `apps/api/test/reports.e2e-spec.ts`

- [x] 写失败 e2e：点赞、取消点赞、收藏、取消收藏。
- [x] 写失败 e2e：关注和取消关注用户。
- [x] 写失败 e2e：列出通知、标记已读。
- [x] 写失败 e2e：创建/读取一对一会话和发送消息。
- [x] 写失败 e2e：举报主题或评论。
- [x] 实现对应模块、服务和控制器。
- [x] 运行新增 API e2e、typecheck、build、lint。
- [x] 提交：`功能：新增社区互动接口`。

## Task 4: 管理后台 API

**Files:**
- Create: `apps/api/src/admin/*`
- Modify: `apps/api/src/app.module.ts`
- Create: `apps/api/test/admin.e2e-spec.ts`

- [x] 写失败 e2e：非管理员访问后台接口返回 403。
- [x] 写失败 e2e：仪表盘统计返回用户数、主题数、评论数、举报数。
- [x] 写失败 e2e：处理举报并写入审计日志。
- [x] 写失败 e2e：用户禁言、封禁、恢复和角色调整。
- [x] 写失败 e2e：分区创建、编辑、关闭、开放。
- [x] 写失败 e2e：标签列表和状态管理。
- [x] 实现 `AdminModule`。
- [x] 运行 admin e2e、typecheck、build、lint。
- [x] 提交：`功能：新增管理后台接口`。

## Task 5: 前台页面接入

**Files:**
- Modify/Create files under `apps/web/src/app`
- Modify/Create files under `apps/web/src/components`
- Modify: `apps/web/src/lib/forum-api.ts`
- Modify: `apps/web/src/lib/forum-api.test.ts`
- Modify: `apps/web/src/app/globals.css`

- [x] 接入首页和分区页真实搜索、筛选、排序。
- [x] 接入详情页编辑、点赞、收藏、关注、举报。
- [x] 新增标签页、成员页、个人主页、通知页、私信页。
- [x] 保持中文 UI 和 GitHub 风格信息密度。
- [x] 运行 web tests、typecheck、build、lint。
- [x] 提交：`功能：补齐前台社区功能`。

## Task 6: 后台页面接入

**Files:**
- Modify/Create files under `apps/admin/src/app`
- Modify/Create files under `apps/admin/src/lib`
- Modify: `apps/admin/src/app/globals.css`

- [x] 接入后台仪表盘统计。
- [x] 接入举报处理、主题审核、用户管理、分区管理、标签管理视图。
- [x] 保持工具型后台，不做营销首页。
- [x] 运行 admin tests、typecheck、build、lint。
- [x] 提交：`功能：接入后台管理页面`。

## Task 7: 数据初始化和文档

**Files:**
- Modify: `apps/api/prisma/seed.ts`
- Modify: `apps/api/prisma/sql/demo-data.sql`
- Modify: `apps/api/prisma/sql/README.md`
- Modify: `README.md`

- [x] 扩展 seed 和 SQL 演示数据，覆盖新增业务模型。
- [x] README 更新完整项目说明、初始化数据库、演示账号、API 摘要和验收流程。
- [x] 验证演示 SQL 可重复导入。
- [ ] 提交：`文档：完善完整交付说明`。

## Task 8: 最终验证和推送

- [x] 启动 `docker compose up -d postgres redis minio`。
- [x] 运行 `pnpm db:migrate`、`pnpm db:seed`、导入演示 SQL。
- [x] 运行 `pnpm test`、`pnpm typecheck`、`pnpm build`、`pnpm lint`、`docker compose config`。
- [x] 使用浏览器验收前台和后台关键路径。
- [ ] 确认 `git status --short` 干净。
- [ ] push 当前分支到远端。
