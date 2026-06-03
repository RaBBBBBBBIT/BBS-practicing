# BBS-practicing

技术向 BBS 课程项目，使用全栈 TypeScript、Next.js、NestJS、PostgreSQL、Redis、MinIO 和 Docker Compose 构建。

## 本地开发

安装依赖：

```bash
pnpm install --frozen-lockfile
```

启动基础设施：

```bash
docker compose up -d postgres redis minio
```

初始化数据库：

```bash
pnpm db:migrate
pnpm db:seed
```

启动前台、后台和 API：

```bash
pnpm dev
```

也可以分别启动用户前台和 API：

```bash
pnpm dev:api
pnpm dev:web
```

默认地址：

- 用户前台：http://localhost:3000
- 用户前台发帖页：http://localhost:3000/threads/new
- 管理后台：http://localhost:3001
- 后端 API：http://localhost:4000/api/health
- MinIO 控制台：http://localhost:9001

## 数据库命令

```bash
pnpm db:migrate
pnpm db:seed
pnpm --filter api prisma:generate
pnpm --filter api prisma:validate
```

默认本地数据库连接：

```txt
postgresql://bbs:bbs_password@localhost:5432/bbs_dev
```

## 业务接口

API 默认前缀是 `http://localhost:4000/api`。

### 认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/auth/register` | 注册用户，设置 HttpOnly 会话 Cookie，返回 `{ user }` |
| `POST` | `/auth/login` | 登录用户，设置 HttpOnly 会话 Cookie，返回 `{ user }` |
| `GET` | `/auth/me` | 读取当前会话用户，未登录返回 `401` |
| `POST` | `/auth/logout` | 删除当前会话并清除 Cookie，返回 `204` |

认证请求示例：

```bash
curl -i -c /tmp/bbs-cookie.txt http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","username":"alice","password":"password123"}'

curl -i -b /tmp/bbs-cookie.txt http://localhost:4000/api/auth/me

curl -i -b /tmp/bbs-cookie.txt -c /tmp/bbs-cookie.txt \
  -X POST http://localhost:4000/api/auth/logout

curl -i -c /tmp/bbs-cookie.txt http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

### 分区和主题

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/boards` | 获取分区列表，包含 `threadCount` |
| `GET` | `/threads` | 获取已发布主题列表，按创建时间倒序 |
| `GET` | `/threads?boardSlug=<slug>` | 获取指定分区的已发布主题列表 |
| `GET` | `/threads/<id>` | 获取已发布主题详情 |
| `POST` | `/threads` | 登录后在开放分区创建主题 |

创建主题请求示例：

```bash
curl http://localhost:4000/api/boards

curl http://localhost:4000/api/threads

curl http://localhost:4000/api/threads?boardSlug=backend

curl http://localhost:4000/api/threads/<thread-id>

curl -i http://localhost:4000/api/threads \
  -H "Content-Type: application/json" \
  -b /tmp/bbs-cookie.txt \
  -d '{"boardId":"<board-id>","title":"How do I structure a NestJS module?","body":"I want to understand how providers and modules fit together.","tags":["nestjs"]}'
```

其中 `<board-id>` 可从 `/api/boards` 返回的分区列表中取得。

## 验证命令

```bash
pnpm install --frozen-lockfile
pnpm --filter api prisma:generate
pnpm test
pnpm typecheck
pnpm build
pnpm lint
docker compose config
```

运行时验收：

```bash
docker compose up -d postgres redis minio
pnpm db:migrate
pnpm db:seed
pnpm dev
```

在另一个终端检查：

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/boards
curl http://localhost:4000/api/threads
```

前台浏览器验收：

- 打开 http://localhost:3000，确认首页展示分区列表、最新主题和登录/注册/发帖入口。
- 进入 `/boards/<slug>`，确认分区信息和该分区主题列表可见。
- 进入 `/threads/<id>`，确认标题、作者、分区、标签和正文可见。
- 进入 http://localhost:3000/register 注册账号，成功后应跳转到 `/threads/new`。
- 在 `/threads/new` 选择分区、填写标题/正文/标签并发布，成功后应跳转到新主题详情页。

预期结果：

- `/api/health` 返回 `{"status":"ok",...}`。
- `/api/boards` 返回 `boards` 数组，包含 `pnpm db:seed` 写入的分区。
- `/api/threads` 返回 `threads` 数组；没有主题时数组为空。
- 用户前台可以完成浏览分区、浏览主题详情、注册、登录和发帖的 MVP 流程。

## 项目结构

```txt
apps/web      用户前台
apps/admin    管理后台
apps/api      NestJS API
packages/shared 共享类型和常量
packages/ui      共享 Web UI 组件
packages/tsconfig 共享 TypeScript 配置
packages/eslint-config 共享 ESLint 配置
```
