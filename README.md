# BBS-practicing

技术向 BBS 课程项目，使用全栈 TypeScript、Next.js、NestJS、PostgreSQL、Redis、MinIO 和 Docker Compose 构建。

## 本地开发

安装依赖：

```bash
pnpm install
```

启动基础设施：

```bash
docker compose up -d postgres redis minio
```

启动前台、后台和 API：

```bash
pnpm dev
```

默认地址：

- 用户前台：http://localhost:3000
- 管理后台：http://localhost:3001
- 后端 API：http://localhost:4000/api/health
- MinIO 控制台：http://localhost:9001

## 验证命令

```bash
pnpm lint
pnpm test
pnpm build
docker compose config
```

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
