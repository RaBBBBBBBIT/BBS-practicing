# Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable TypeScript monorepo foundation for the technical BBS, including `web`, `admin`, `api`, shared packages, local infrastructure, and verification commands.

**Architecture:** The repository uses pnpm workspaces and Turborepo. `apps/web` and `apps/admin` are Next.js apps, `apps/api` is a NestJS service, and shared code lives under `packages/`. Docker Compose runs PostgreSQL, Redis, and MinIO for local development.

**Tech Stack:** TypeScript, pnpm, Turborepo, Next.js, NestJS, Vitest, tsup, PostgreSQL, Redis, MinIO, Docker Compose.

---

## Scope

The approved design covers several subsystems. This plan implements only the first foundation slice:

- Monorepo workspace files and shared toolchain.
- Shared TypeScript config and ESLint config packages.
- Shared domain type package with a tested health response helper.
- Minimal reusable Web UI package.
- Minimal NestJS API with `/api/health`.
- Minimal Next.js user frontend and admin frontend.
- Docker Compose local infrastructure for PostgreSQL, Redis, and MinIO.
- README instructions and verification commands.

Separate implementation plans should cover database schema and auth, content and comments, interactions and notifications, moderation and admin workflows, and production deployment hardening.

## File Structure

Create or modify these files:

- Modify: `.gitignore`
- Modify: `README.md`
- Create: `.env.example`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `eslint.config.mjs`
- Create: `docker-compose.yml`
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/next.json`
- Create: `packages/tsconfig/nest.json`
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/base.mjs`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.test.ts`
- Create: `packages/shared/src/index.ts`
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.test.tsx`
- Create: `packages/ui/src/index.tsx`
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/test/health.e2e-spec.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.module.ts`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/src/lib/home-copy.test.ts`
- Create: `apps/web/src/lib/home-copy.ts`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.mjs`
- Create: `apps/admin/src/lib/dashboard-copy.test.ts`
- Create: `apps/admin/src/lib/dashboard-copy.ts`
- Create: `apps/admin/src/app/globals.css`
- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/app/page.tsx`

### Task 1: Root Workspace Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create root workspace files**

Use this patch:

```diff
diff --git a/package.json b/package.json
new file mode 100644
--- /dev/null
+++ b/package.json
@@
+{
+  "name": "bbs-practicing",
+  "version": "0.1.0",
+  "private": true,
+  "packageManager": "pnpm@9.15.4",
+  "scripts": {
+    "dev": "pnpm --filter @bbs/shared build && pnpm --filter @bbs/ui build && turbo dev",
+    "dev:web": "pnpm --filter web dev",
+    "dev:admin": "pnpm --filter admin dev",
+    "dev:api": "pnpm --filter api start:dev",
+    "db:migrate": "pnpm --filter api prisma migrate dev",
+    "db:seed": "pnpm --filter api prisma db seed",
+    "lint": "turbo lint",
+    "test": "turbo test",
+    "build": "turbo build",
+    "typecheck": "turbo typecheck"
+  }
+}
diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml
new file mode 100644
--- /dev/null
+++ b/pnpm-workspace.yaml
@@
+packages:
+  - "apps/*"
+  - "packages/*"
diff --git a/turbo.json b/turbo.json
new file mode 100644
--- /dev/null
+++ b/turbo.json
@@
+{
+  "$schema": "https://turbo.build/schema.json",
+  "tasks": {
+    "build": {
+      "dependsOn": ["^build"],
+      "outputs": ["dist/**", ".next/**"]
+    },
+    "dev": {
+      "cache": false,
+      "persistent": true
+    },
+    "lint": {
+      "dependsOn": ["^build"],
+      "outputs": []
+    },
+    "test": {
+      "dependsOn": ["^build"],
+      "outputs": ["coverage/**"]
+    },
+    "typecheck": {
+      "dependsOn": ["^build"],
+      "outputs": []
+    }
+  }
+}
diff --git a/tsconfig.base.json b/tsconfig.base.json
new file mode 100644
--- /dev/null
+++ b/tsconfig.base.json
@@
+{
+  "compilerOptions": {
+    "target": "ES2022",
+    "lib": ["ES2022", "DOM", "DOM.Iterable"],
+    "module": "ESNext",
+    "moduleResolution": "Bundler",
+    "strict": true,
+    "noUncheckedIndexedAccess": true,
+    "exactOptionalPropertyTypes": true,
+    "esModuleInterop": true,
+    "forceConsistentCasingInFileNames": true,
+    "skipLibCheck": true,
+    "resolveJsonModule": true,
+    "baseUrl": ".",
+    "paths": {
+      "@bbs/shared": ["packages/shared/src/index.ts"],
+      "@bbs/ui": ["packages/ui/src/index.tsx"]
+    }
+  }
+}
diff --git a/.env.example b/.env.example
new file mode 100644
--- /dev/null
+++ b/.env.example
@@
+NODE_ENV=development
+
+WEB_PORT=3000
+ADMIN_PORT=3001
+API_PORT=4000
+
+POSTGRES_USER=bbs
+POSTGRES_PASSWORD=bbs_password
+POSTGRES_DB=bbs_dev
+DATABASE_URL=postgresql://bbs:bbs_password@localhost:5432/bbs_dev
+
+REDIS_URL=redis://localhost:6379
+
+MINIO_ROOT_USER=minio
+MINIO_ROOT_PASSWORD=minio_password
+MINIO_ENDPOINT=http://localhost:9000
+MINIO_BUCKET=bbs-assets
+MINIO_PUBLIC_URL=http://localhost:9000/bbs-assets
diff --git a/.gitignore b/.gitignore
--- a/.gitignore
+++ b/.gitignore
@@
 .superpowers/
+node_modules/
+.next/
+dist/
+coverage/
+.turbo/
+.env
+.DS_Store
+*.log
```

- [ ] **Step 2: Install root development dependencies**

Run:

```bash
corepack enable
pnpm add -D -w turbo typescript tsx tsup vitest @vitest/coverage-v8 eslint @eslint/js typescript-eslint prettier @types/node
```

Expected: pnpm updates `package.json` and creates `pnpm-lock.yaml` without dependency resolution errors.

- [ ] **Step 3: Verify workspace tooling is callable**

Run:

```bash
pnpm exec turbo --version
pnpm exec tsc --version
pnpm exec vitest --version
```

Expected: each command prints a version number and exits with code 0.

- [ ] **Step 4: Commit root workspace tooling**

Run:

```bash
git add .gitignore .env.example package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json
git commit -m "维护：搭建 monorepo 工作区"
```

Expected: git creates a commit containing only root workspace tooling.

### Task 2: Shared Config Packages

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/next.json`
- Create: `packages/tsconfig/nest.json`
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/base.mjs`

- [ ] **Step 1: Create shared TypeScript and ESLint config packages**

Use this patch:

```diff
diff --git a/packages/tsconfig/package.json b/packages/tsconfig/package.json
new file mode 100644
--- /dev/null
+++ b/packages/tsconfig/package.json
@@
+{
+  "name": "@bbs/tsconfig",
+  "version": "0.1.0",
+  "private": true,
+  "files": [
+    "base.json",
+    "next.json",
+    "nest.json"
+  ]
+}
diff --git a/packages/tsconfig/base.json b/packages/tsconfig/base.json
new file mode 100644
--- /dev/null
+++ b/packages/tsconfig/base.json
@@
+{
+  "extends": "../../tsconfig.base.json"
+}
diff --git a/packages/tsconfig/next.json b/packages/tsconfig/next.json
new file mode 100644
--- /dev/null
+++ b/packages/tsconfig/next.json
@@
+{
+  "extends": "./base.json",
+  "compilerOptions": {
+    "allowJs": false,
+    "jsx": "preserve",
+    "noEmit": true,
+    "incremental": true,
+    "plugins": [
+      {
+        "name": "next"
+      }
+    ]
+  }
+}
diff --git a/packages/tsconfig/nest.json b/packages/tsconfig/nest.json
new file mode 100644
--- /dev/null
+++ b/packages/tsconfig/nest.json
@@
+{
+  "extends": "./base.json",
+  "compilerOptions": {
+    "module": "NodeNext",
+    "moduleResolution": "NodeNext",
+    "outDir": "dist",
+    "rootDir": "src",
+    "declaration": true,
+    "sourceMap": true,
+    "experimentalDecorators": true,
+    "emitDecoratorMetadata": true,
+    "strictPropertyInitialization": false
+  }
+}
diff --git a/packages/eslint-config/package.json b/packages/eslint-config/package.json
new file mode 100644
--- /dev/null
+++ b/packages/eslint-config/package.json
@@
+{
+  "name": "@bbs/eslint-config",
+  "version": "0.1.0",
+  "private": true,
+  "type": "module",
+  "exports": {
+    "./base": "./base.mjs"
+  }
+}
diff --git a/packages/eslint-config/base.mjs b/packages/eslint-config/base.mjs
new file mode 100644
--- /dev/null
+++ b/packages/eslint-config/base.mjs
@@
+import js from "@eslint/js";
+import tseslint from "typescript-eslint";
+
+export default [
+  {
+    ignores: ["node_modules/**", "dist/**", ".next/**", "coverage/**", ".turbo/**"]
+  },
+  js.configs.recommended,
+  ...tseslint.configs.recommended,
+  {
+    files: ["**/*.ts", "**/*.tsx"],
+    rules: {
+      "@typescript-eslint/no-unused-vars": [
+        "error",
+        {
+          "argsIgnorePattern": "^_",
+          "varsIgnorePattern": "^_"
+        }
+      ],
+      "no-console": [
+        "warn",
+        {
+          "allow": ["warn", "error"]
+        }
+      ],
+      "no-undef": "off"
+    }
+  }
+];
diff --git a/eslint.config.mjs b/eslint.config.mjs
new file mode 100644
--- /dev/null
+++ b/eslint.config.mjs
@@
+import baseConfig from "./packages/eslint-config/base.mjs";
+
+export default baseConfig;
```

- [ ] **Step 2: Verify config packages are visible to pnpm**

Run:

```bash
pnpm list --depth -1 --filter @bbs/tsconfig
pnpm list --depth -1 --filter @bbs/eslint-config
```

Expected: pnpm prints `@bbs/tsconfig` and `@bbs/eslint-config`.

- [ ] **Step 3: Commit shared config packages**

Run:

```bash
git add eslint.config.mjs packages/tsconfig packages/eslint-config
git commit -m "维护：新增共享配置包"
```

Expected: git creates a commit containing shared config package files.

### Task 3: Shared Domain Package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.test.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Write the failing shared package test**

Use this patch:

```diff
diff --git a/packages/shared/package.json b/packages/shared/package.json
new file mode 100644
--- /dev/null
+++ b/packages/shared/package.json
@@
+{
+  "name": "@bbs/shared",
+  "version": "0.1.0",
+  "private": true,
+  "type": "module",
+  "main": "./dist/index.js",
+  "types": "./dist/index.d.ts",
+  "exports": {
+    ".": {
+      "types": "./dist/index.d.ts",
+      "import": "./dist/index.js"
+    }
+  },
+  "scripts": {
+    "dev": "tsup src/index.ts --format esm --dts --watch",
+    "build": "tsup src/index.ts --format esm --dts",
+    "lint": "eslint --config ../../eslint.config.mjs \"src/**/*.ts\"",
+    "test": "vitest run",
+    "typecheck": "tsc --noEmit"
+  }
+}
diff --git a/packages/shared/tsconfig.json b/packages/shared/tsconfig.json
new file mode 100644
--- /dev/null
+++ b/packages/shared/tsconfig.json
@@
+{
+  "extends": "../tsconfig/base.json",
+  "compilerOptions": {
+    "outDir": "dist"
+  },
+  "include": ["src/**/*.ts"]
+}
diff --git a/packages/shared/src/index.test.ts b/packages/shared/src/index.test.ts
new file mode 100644
--- /dev/null
+++ b/packages/shared/src/index.test.ts
@@
+import { describe, expect, it } from "vitest";
+import { createHealthResponse, ThreadStatus, UserRole, UserStatus } from "./index";
+
+describe("shared domain constants", () => {
+  it("exposes stable role and status values", () => {
+    expect(UserRole.Admin).toBe("admin");
+    expect(UserStatus.Muted).toBe("muted");
+    expect(ThreadStatus.Published).toBe("published");
+  });
+});
+
+describe("createHealthResponse", () => {
+  it("creates an API health payload with an ISO timestamp", () => {
+    const response = createHealthResponse("api");
+
+    expect(response.status).toBe("ok");
+    expect(response.service).toBe("api");
+    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
+  });
+});
diff --git a/packages/shared/src/index.ts b/packages/shared/src/index.ts
new file mode 100644
--- /dev/null
+++ b/packages/shared/src/index.ts
@@
+export {};
```

- [ ] **Step 2: Run the shared package test and verify it fails**

Run:

```bash
pnpm --filter @bbs/shared test
```

Expected: FAIL because `createHealthResponse`, `ThreadStatus`, `UserRole`, and `UserStatus` are not exported from `src/index.ts`.

- [ ] **Step 3: Implement shared enums and health payload helper**

Replace `packages/shared/src/index.ts` with:

```ts
export enum UserRole {
  Guest = "guest",
  User = "user",
  Moderator = "moderator",
  Admin = "admin"
}

export enum UserStatus {
  Active = "active",
  Muted = "muted",
  Banned = "banned"
}

export enum ThreadStatus {
  Draft = "draft",
  Published = "published",
  Hidden = "hidden",
  Deleted = "deleted"
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export function createHealthResponse(service: string): HealthResponse {
  return {
    status: "ok",
    service,
    timestamp: new Date().toISOString()
  };
}
```

- [ ] **Step 4: Run shared package tests and build**

Run:

```bash
pnpm --filter @bbs/shared test
pnpm --filter @bbs/shared build
```

Expected: tests pass and `packages/shared/dist/index.js` plus `packages/shared/dist/index.d.ts` are created.

- [ ] **Step 5: Commit shared domain package**

Run:

```bash
git add packages/shared
git commit -m "功能：新增共享领域类型包"
```

Expected: git creates a commit containing the shared package.

### Task 4: Shared Web UI Package

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.test.tsx`
- Create: `packages/ui/src/index.tsx`

- [ ] **Step 1: Add UI package React dependencies**

Run:

```bash
pnpm add -D -w react react-dom @types/react @types/react-dom
```

Expected: pnpm updates the root dependency graph and exits with code 0.

- [ ] **Step 2: Write the failing UI package test**

Use this patch:

```diff
diff --git a/packages/ui/package.json b/packages/ui/package.json
new file mode 100644
--- /dev/null
+++ b/packages/ui/package.json
@@
+{
+  "name": "@bbs/ui",
+  "version": "0.1.0",
+  "private": true,
+  "type": "module",
+  "main": "./dist/index.js",
+  "types": "./dist/index.d.ts",
+  "exports": {
+    ".": {
+      "types": "./dist/index.d.ts",
+      "import": "./dist/index.js"
+    }
+  },
+  "scripts": {
+    "dev": "tsup src/index.tsx --format esm --dts --external react --watch",
+    "build": "tsup src/index.tsx --format esm --dts --external react",
+    "lint": "eslint --config ../../eslint.config.mjs \"src/**/*.{ts,tsx}\"",
+    "test": "vitest run",
+    "typecheck": "tsc --noEmit"
+  },
+  "peerDependencies": {
+    "react": ">=18",
+    "react-dom": ">=18"
+  }
+}
diff --git a/packages/ui/tsconfig.json b/packages/ui/tsconfig.json
new file mode 100644
--- /dev/null
+++ b/packages/ui/tsconfig.json
@@
+{
+  "extends": "../tsconfig/base.json",
+  "compilerOptions": {
+    "jsx": "react-jsx",
+    "outDir": "dist"
+  },
+  "include": ["src/**/*.ts", "src/**/*.tsx"]
+}
diff --git a/packages/ui/src/index.test.tsx b/packages/ui/src/index.test.tsx
new file mode 100644
--- /dev/null
+++ b/packages/ui/src/index.test.tsx
@@
+import { describe, expect, it } from "vitest";
+import { renderToStaticMarkup } from "react-dom/server";
+import { ShellBadge } from "./index";
+
+describe("ShellBadge", () => {
+  it("renders the supplied label", () => {
+    const html = renderToStaticMarkup(<ShellBadge label="API online" />);
+
+    expect(html).toContain("API online");
+  });
+});
diff --git a/packages/ui/src/index.tsx b/packages/ui/src/index.tsx
new file mode 100644
--- /dev/null
+++ b/packages/ui/src/index.tsx
@@
+export {};
```

- [ ] **Step 3: Run the UI package test and verify it fails**

Run:

```bash
pnpm --filter @bbs/ui test
```

Expected: FAIL because `ShellBadge` is not exported from `src/index.tsx`.

- [ ] **Step 4: Implement `ShellBadge`**

Replace `packages/ui/src/index.tsx` with:

```tsx
export interface ShellBadgeProps {
  label: string;
}

export function ShellBadge({ label }: ShellBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid #d0d7de",
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 12,
        fontWeight: 600,
        color: "#0969da",
        background: "#f6f8fa"
      }}
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 5: Run UI package tests and build**

Run:

```bash
pnpm --filter @bbs/ui test
pnpm --filter @bbs/ui build
```

Expected: tests pass and `packages/ui/dist/index.js` plus `packages/ui/dist/index.d.ts` are created.

- [ ] **Step 6: Commit shared UI package**

Run:

```bash
git add package.json pnpm-lock.yaml packages/ui
git commit -m "功能：新增共享 UI 组件包"
```

Expected: git creates a commit containing the UI package and dependency updates.

### Task 5: NestJS API Foundation

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/test/health.e2e-spec.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.module.ts`

- [ ] **Step 1: Create API package metadata and failing health test**

Use this patch:

```diff
diff --git a/apps/api/package.json b/apps/api/package.json
new file mode 100644
--- /dev/null
+++ b/apps/api/package.json
@@
+{
+  "name": "api",
+  "version": "0.1.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "start:dev": "tsx watch src/main.ts",
+    "build": "tsc -p tsconfig.build.json",
+    "lint": "eslint --config ../../eslint.config.mjs \"src/**/*.ts\" \"test/**/*.ts\"",
+    "test": "vitest run",
+    "typecheck": "tsc --noEmit"
+  },
+  "dependencies": {
+    "@bbs/shared": "workspace:*"
+  }
+}
diff --git a/apps/api/tsconfig.json b/apps/api/tsconfig.json
new file mode 100644
--- /dev/null
+++ b/apps/api/tsconfig.json
@@
+{
+  "extends": "../../packages/tsconfig/nest.json",
+  "compilerOptions": {
+    "rootDir": "."
+  },
+  "include": ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"]
+}
diff --git a/apps/api/tsconfig.build.json b/apps/api/tsconfig.build.json
new file mode 100644
--- /dev/null
+++ b/apps/api/tsconfig.build.json
@@
+{
+  "extends": "./tsconfig.json",
+  "compilerOptions": {
+    "rootDir": "src"
+  },
+  "include": ["src/**/*.ts"],
+  "exclude": ["test/**/*.ts", "**/*.test.ts", "**/*.spec.ts"]
+}
diff --git a/apps/api/vitest.config.ts b/apps/api/vitest.config.ts
new file mode 100644
--- /dev/null
+++ b/apps/api/vitest.config.ts
@@
+import { defineConfig } from "vitest/config";
+
+export default defineConfig({
+  test: {
+    environment: "node",
+    globals: false
+  }
+});
diff --git a/apps/api/test/health.e2e-spec.ts b/apps/api/test/health.e2e-spec.ts
new file mode 100644
--- /dev/null
+++ b/apps/api/test/health.e2e-spec.ts
@@
+import { describe, expect, it } from "vitest";
+import { Test } from "@nestjs/testing";
+import request from "supertest";
+import { AppModule } from "../src/app.module";
+
+describe("Health endpoint", () => {
+  it("returns an API health response", async () => {
+    const moduleRef = await Test.createTestingModule({
+      imports: [AppModule]
+    }).compile();
+
+    const app = moduleRef.createNestApplication();
+    app.setGlobalPrefix("api");
+    await app.init();
+
+    await request(app.getHttpServer())
+      .get("/api/health")
+      .expect(200)
+      .expect(({ body }) => {
+        expect(body.status).toBe("ok");
+        expect(body.service).toBe("api");
+        expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
+      });
+
+    await app.close();
+  });
+});
```

- [ ] **Step 2: Install API runtime and test dependencies**

Run:

```bash
pnpm add --filter api @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
pnpm add -D --filter api @nestjs/testing supertest @types/supertest
```

Expected: pnpm updates `apps/api/package.json` and `pnpm-lock.yaml`.

- [ ] **Step 3: Run the API health test and verify it fails**

Run:

```bash
pnpm --filter @bbs/shared build
pnpm --filter api test
```

Expected: FAIL because `../src/app.module` does not exist.

- [ ] **Step 4: Implement the API health module**

Use this patch:

```diff
diff --git a/apps/api/src/main.ts b/apps/api/src/main.ts
new file mode 100644
--- /dev/null
+++ b/apps/api/src/main.ts
@@
+import "reflect-metadata";
+import { NestFactory } from "@nestjs/core";
+import { AppModule } from "./app.module";
+
+const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);
+
+async function bootstrap() {
+  const app = await NestFactory.create(AppModule);
+  app.setGlobalPrefix("api");
+  app.enableCors({
+    origin: ["http://localhost:3000", "http://localhost:3001"],
+    credentials: true
+  });
+  await app.listen(port);
+}
+
+void bootstrap();
diff --git a/apps/api/src/app.module.ts b/apps/api/src/app.module.ts
new file mode 100644
--- /dev/null
+++ b/apps/api/src/app.module.ts
@@
+import { Module } from "@nestjs/common";
+import { HealthModule } from "./health/health.module";
+
+@Module({
+  imports: [HealthModule]
+})
+export class AppModule {}
diff --git a/apps/api/src/health/health.controller.ts b/apps/api/src/health/health.controller.ts
new file mode 100644
--- /dev/null
+++ b/apps/api/src/health/health.controller.ts
@@
+import { Controller, Get } from "@nestjs/common";
+import { createHealthResponse, type HealthResponse } from "@bbs/shared";
+
+@Controller("health")
+export class HealthController {
+  @Get()
+  getHealth(): HealthResponse {
+    return createHealthResponse("api");
+  }
+}
diff --git a/apps/api/src/health/health.module.ts b/apps/api/src/health/health.module.ts
new file mode 100644
--- /dev/null
+++ b/apps/api/src/health/health.module.ts
@@
+import { Module } from "@nestjs/common";
+import { HealthController } from "./health.controller";
+
+@Module({
+  controllers: [HealthController]
+})
+export class HealthModule {}
```

- [ ] **Step 5: Run API tests and build**

Run:

```bash
pnpm --filter @bbs/shared build
pnpm --filter api test
pnpm --filter api build
```

Expected: health test passes and `apps/api/dist/main.js` is created.

- [ ] **Step 6: Commit API foundation**

Run:

```bash
git add apps/api package.json pnpm-lock.yaml
git commit -m "功能：新增 API 健康检查基础"
```

Expected: git creates a commit containing the API foundation and dependency updates.

### Task 6: User Frontend Foundation

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/src/lib/home-copy.test.ts`
- Create: `apps/web/src/lib/home-copy.ts`
- Create: `apps/web/src/app/globals.css`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Create Web package metadata and failing copy test**

Use this patch:

```diff
diff --git a/apps/web/package.json b/apps/web/package.json
new file mode 100644
--- /dev/null
+++ b/apps/web/package.json
@@
+{
+  "name": "web",
+  "version": "0.1.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "dev": "next dev --port 3000",
+    "build": "next build",
+    "lint": "eslint --config ../../eslint.config.mjs \"src/**/*.{ts,tsx}\"",
+    "test": "vitest run",
+    "typecheck": "tsc --noEmit"
+  },
+  "dependencies": {
+    "@bbs/shared": "workspace:*",
+    "@bbs/ui": "workspace:*"
+  }
+}
diff --git a/apps/web/tsconfig.json b/apps/web/tsconfig.json
new file mode 100644
--- /dev/null
+++ b/apps/web/tsconfig.json
@@
+{
+  "extends": "../../packages/tsconfig/next.json",
+  "compilerOptions": {
+    "baseUrl": "."
+  },
+  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
+  "exclude": ["node_modules"]
+}
diff --git a/apps/web/next.config.mjs b/apps/web/next.config.mjs
new file mode 100644
--- /dev/null
+++ b/apps/web/next.config.mjs
@@
+/** @type {import("next").NextConfig} */
+const nextConfig = {
+  transpilePackages: ["@bbs/ui", "@bbs/shared"]
+};
+
+export default nextConfig;
diff --git a/apps/web/src/lib/home-copy.test.ts b/apps/web/src/lib/home-copy.test.ts
new file mode 100644
--- /dev/null
+++ b/apps/web/src/lib/home-copy.test.ts
@@
+import { describe, expect, it } from "vitest";
+import { getHomePageCopy } from "./home-copy";
+
+describe("getHomePageCopy", () => {
+  it("describes the technical BBS user frontend", () => {
+    expect(getHomePageCopy()).toEqual({
+      title: "技术讨论与社区分享",
+      subtitle: "面向开发者的主题讨论、经验沉淀和社区互动空间",
+      badge: "User Frontend"
+    });
+  });
+});
```

- [ ] **Step 2: Install Web runtime dependencies**

Run:

```bash
pnpm add --filter web next react react-dom
pnpm add -D --filter web @types/react @types/react-dom
```

Expected: pnpm updates `apps/web/package.json` and `pnpm-lock.yaml`.

- [ ] **Step 3: Run the Web copy test and verify it fails**

Run:

```bash
pnpm --filter web test
```

Expected: FAIL because `apps/web/src/lib/home-copy.ts` does not exist.

- [ ] **Step 4: Implement the Web home copy helper and page**

Use this patch:

```diff
diff --git a/apps/web/src/lib/home-copy.ts b/apps/web/src/lib/home-copy.ts
new file mode 100644
--- /dev/null
+++ b/apps/web/src/lib/home-copy.ts
@@
+export interface HomePageCopy {
+  title: string;
+  subtitle: string;
+  badge: string;
+}
+
+export function getHomePageCopy(): HomePageCopy {
+  return {
+    title: "技术讨论与社区分享",
+    subtitle: "面向开发者的主题讨论、经验沉淀和社区互动空间",
+    badge: "User Frontend"
+  };
+}
diff --git a/apps/web/src/app/globals.css b/apps/web/src/app/globals.css
new file mode 100644
--- /dev/null
+++ b/apps/web/src/app/globals.css
@@
+* {
+  box-sizing: border-box;
+}
+
+body {
+  margin: 0;
+  font-family: Arial, "Helvetica Neue", sans-serif;
+  color: #24292f;
+  background: #f6f8fa;
+}
+
+main {
+  min-height: 100vh;
+  padding: 48px 24px;
+}
+
+.shell {
+  max-width: 960px;
+  margin: 0 auto;
+}
diff --git a/apps/web/src/app/layout.tsx b/apps/web/src/app/layout.tsx
new file mode 100644
--- /dev/null
+++ b/apps/web/src/app/layout.tsx
@@
+import type { Metadata } from "next";
+import type { ReactNode } from "react";
+import "./globals.css";
+
+export const metadata: Metadata = {
+  title: "BBS Practicing",
+  description: "Technical discussion and community sharing platform"
+};
+
+export default function RootLayout({ children }: { children: ReactNode }) {
+  return (
+    <html lang="zh-CN">
+      <body>{children}</body>
+    </html>
+  );
+}
diff --git a/apps/web/src/app/page.tsx b/apps/web/src/app/page.tsx
new file mode 100644
--- /dev/null
+++ b/apps/web/src/app/page.tsx
@@
+import { ShellBadge } from "@bbs/ui";
+import { getHomePageCopy } from "../lib/home-copy";
+
+export default function HomePage() {
+  const copy = getHomePageCopy();
+
+  return (
+    <main>
+      <section className="shell">
+        <ShellBadge label={copy.badge} />
+        <h1>{copy.title}</h1>
+        <p>{copy.subtitle}</p>
+      </section>
+    </main>
+  );
+}
```

- [ ] **Step 5: Run Web tests and build**

Run:

```bash
pnpm --filter @bbs/ui build
pnpm --filter @bbs/shared build
pnpm --filter web test
pnpm --filter web build
```

Expected: test passes and Next.js writes `apps/web/.next`.

- [ ] **Step 6: Commit user frontend foundation**

Run:

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "功能：新增用户前台基础"
```

Expected: git creates a commit containing the user frontend.

### Task 7: Admin Frontend Foundation

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.mjs`
- Create: `apps/admin/src/lib/dashboard-copy.test.ts`
- Create: `apps/admin/src/lib/dashboard-copy.ts`
- Create: `apps/admin/src/app/globals.css`
- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/app/page.tsx`

- [ ] **Step 1: Create Admin package metadata and failing dashboard copy test**

Use this patch:

```diff
diff --git a/apps/admin/package.json b/apps/admin/package.json
new file mode 100644
--- /dev/null
+++ b/apps/admin/package.json
@@
+{
+  "name": "admin",
+  "version": "0.1.0",
+  "private": true,
+  "type": "module",
+  "scripts": {
+    "dev": "next dev --port 3001",
+    "build": "next build",
+    "lint": "eslint --config ../../eslint.config.mjs \"src/**/*.{ts,tsx}\"",
+    "test": "vitest run",
+    "typecheck": "tsc --noEmit"
+  },
+  "dependencies": {
+    "@bbs/shared": "workspace:*",
+    "@bbs/ui": "workspace:*"
+  }
+}
diff --git a/apps/admin/tsconfig.json b/apps/admin/tsconfig.json
new file mode 100644
--- /dev/null
+++ b/apps/admin/tsconfig.json
@@
+{
+  "extends": "../../packages/tsconfig/next.json",
+  "compilerOptions": {
+    "baseUrl": "."
+  },
+  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
+  "exclude": ["node_modules"]
+}
diff --git a/apps/admin/next.config.mjs b/apps/admin/next.config.mjs
new file mode 100644
--- /dev/null
+++ b/apps/admin/next.config.mjs
@@
+/** @type {import("next").NextConfig} */
+const nextConfig = {
+  transpilePackages: ["@bbs/ui", "@bbs/shared"]
+};
+
+export default nextConfig;
diff --git a/apps/admin/src/lib/dashboard-copy.test.ts b/apps/admin/src/lib/dashboard-copy.test.ts
new file mode 100644
--- /dev/null
+++ b/apps/admin/src/lib/dashboard-copy.test.ts
@@
+import { describe, expect, it } from "vitest";
+import { getDashboardCopy } from "./dashboard-copy";
+
+describe("getDashboardCopy", () => {
+  it("describes the moderation dashboard", () => {
+    expect(getDashboardCopy()).toEqual({
+      title: "管理后台",
+      subtitle: "处理内容审核、举报、用户和分区治理",
+      badge: "Admin Console"
+    });
+  });
+});
```

- [ ] **Step 2: Install Admin runtime dependencies**

Run:

```bash
pnpm add --filter admin next react react-dom
pnpm add -D --filter admin @types/react @types/react-dom
```

Expected: pnpm updates `apps/admin/package.json` and `pnpm-lock.yaml`.

- [ ] **Step 3: Run the Admin copy test and verify it fails**

Run:

```bash
pnpm --filter admin test
```

Expected: FAIL because `apps/admin/src/lib/dashboard-copy.ts` does not exist.

- [ ] **Step 4: Implement the Admin dashboard copy helper and page**

Use this patch:

```diff
diff --git a/apps/admin/src/lib/dashboard-copy.ts b/apps/admin/src/lib/dashboard-copy.ts
new file mode 100644
--- /dev/null
+++ b/apps/admin/src/lib/dashboard-copy.ts
@@
+export interface DashboardCopy {
+  title: string;
+  subtitle: string;
+  badge: string;
+}
+
+export function getDashboardCopy(): DashboardCopy {
+  return {
+    title: "管理后台",
+    subtitle: "处理内容审核、举报、用户和分区治理",
+    badge: "Admin Console"
+  };
+}
diff --git a/apps/admin/src/app/globals.css b/apps/admin/src/app/globals.css
new file mode 100644
--- /dev/null
+++ b/apps/admin/src/app/globals.css
@@
+* {
+  box-sizing: border-box;
+}
+
+body {
+  margin: 0;
+  font-family: Arial, "Helvetica Neue", sans-serif;
+  color: #1f2328;
+  background: #ffffff;
+}
+
+main {
+  min-height: 100vh;
+  padding: 40px 24px;
+  background: #f6f8fa;
+}
+
+.shell {
+  max-width: 1040px;
+  margin: 0 auto;
+}
diff --git a/apps/admin/src/app/layout.tsx b/apps/admin/src/app/layout.tsx
new file mode 100644
--- /dev/null
+++ b/apps/admin/src/app/layout.tsx
@@
+import type { Metadata } from "next";
+import type { ReactNode } from "react";
+import "./globals.css";
+
+export const metadata: Metadata = {
+  title: "BBS Admin",
+  description: "Technical BBS moderation and administration console"
+};
+
+export default function RootLayout({ children }: { children: ReactNode }) {
+  return (
+    <html lang="zh-CN">
+      <body>{children}</body>
+    </html>
+  );
+}
diff --git a/apps/admin/src/app/page.tsx b/apps/admin/src/app/page.tsx
new file mode 100644
--- /dev/null
+++ b/apps/admin/src/app/page.tsx
@@
+import { ShellBadge } from "@bbs/ui";
+import { getDashboardCopy } from "../lib/dashboard-copy";
+
+export default function AdminDashboardPage() {
+  const copy = getDashboardCopy();
+
+  return (
+    <main>
+      <section className="shell">
+        <ShellBadge label={copy.badge} />
+        <h1>{copy.title}</h1>
+        <p>{copy.subtitle}</p>
+      </section>
+    </main>
+  );
+}
```

- [ ] **Step 5: Run Admin tests and build**

Run:

```bash
pnpm --filter @bbs/ui build
pnpm --filter @bbs/shared build
pnpm --filter admin test
pnpm --filter admin build
```

Expected: test passes and Next.js writes `apps/admin/.next`.

- [ ] **Step 6: Commit admin frontend foundation**

Run:

```bash
git add apps/admin package.json pnpm-lock.yaml
git commit -m "功能：新增管理后台基础"
```

Expected: git creates a commit containing the admin frontend.

### Task 8: Local Infrastructure Compose

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create local infrastructure compose file**

Use this patch:

```diff
diff --git a/docker-compose.yml b/docker-compose.yml
new file mode 100644
--- /dev/null
+++ b/docker-compose.yml
@@
+services:
+  postgres:
+    image: postgres:16-alpine
+    container_name: bbs-postgres
+    environment:
+      POSTGRES_USER: ${POSTGRES_USER:-bbs}
+      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-bbs_password}
+      POSTGRES_DB: ${POSTGRES_DB:-bbs_dev}
+    ports:
+      - "5432:5432"
+    volumes:
+      - postgres_data:/var/lib/postgresql/data
+    healthcheck:
+      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-bbs} -d ${POSTGRES_DB:-bbs_dev}"]
+      interval: 10s
+      timeout: 5s
+      retries: 5
+
+  redis:
+    image: redis:7-alpine
+    container_name: bbs-redis
+    ports:
+      - "6379:6379"
+    volumes:
+      - redis_data:/data
+    healthcheck:
+      test: ["CMD", "redis-cli", "ping"]
+      interval: 10s
+      timeout: 5s
+      retries: 5
+
+  minio:
+    image: minio/minio:latest
+    container_name: bbs-minio
+    command: server /data --console-address ":9001"
+    environment:
+      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minio}
+      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minio_password}
+    ports:
+      - "9000:9000"
+      - "9001:9001"
+    volumes:
+      - minio_data:/data
+
+volumes:
+  postgres_data:
+  redis_data:
+  minio_data:
```

- [ ] **Step 2: Validate Compose syntax**

Run:

```bash
docker compose config
```

Expected: Docker prints the normalized Compose configuration and exits with code 0.

- [ ] **Step 3: Start infrastructure services**

Run:

```bash
docker compose up -d postgres redis minio
docker compose ps
```

Expected: `bbs-postgres`, `bbs-redis`, and `bbs-minio` are listed as running.

- [ ] **Step 4: Stop infrastructure services**

Run:

```bash
docker compose down
```

Expected: Docker stops and removes the three service containers.

- [ ] **Step 5: Commit local infrastructure**

Run:

```bash
git add docker-compose.yml
git commit -m "维护：新增本地基础设施编排"
```

Expected: git creates a commit containing the Compose file.

### Task 9: README Development Guide

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README with local development instructions**

Replace `README.md` with:

````md
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
````

- [ ] **Step 2: Check README Markdown shape**

Run:

```bash
sed -n '1,220p' README.md
```

Expected: the README displays the sections `本地开发`, `验证命令`, and `项目结构`.

- [ ] **Step 3: Commit README update**

Run:

```bash
git add README.md
git commit -m "文档：新增本地开发说明"
```

Expected: git creates a commit containing the README update.

### Task 10: Foundation Verification

**Files:**
- No new files.

- [ ] **Step 1: Install dependencies from a clean lockfile state**

Run:

```bash
pnpm install
```

Expected: pnpm completes installation with no workspace package errors.

- [ ] **Step 2: Build shared packages**

Run:

```bash
pnpm --filter @bbs/shared build
pnpm --filter @bbs/ui build
```

Expected: both packages create `dist/` output.

- [ ] **Step 3: Run all tests**

Run:

```bash
pnpm test
```

Expected: shared package, UI package, API, Web, and Admin tests pass.

- [ ] **Step 4: Run all builds**

Run:

```bash
pnpm build
```

Expected: shared package, UI package, API, Web, and Admin build successfully.

- [ ] **Step 5: Run all type checks**

Run:

```bash
pnpm typecheck
```

Expected: all TypeScript projects complete with no type errors.

- [ ] **Step 6: Run all lint checks**

Run:

```bash
pnpm lint
```

Expected: all configured lint commands pass.

- [ ] **Step 7: Verify local infrastructure definition**

Run:

```bash
docker compose config
```

Expected: Docker Compose prints the normalized services for `postgres`, `redis`, and `minio`.

- [ ] **Step 8: Start dev services manually in separate terminals**

Terminal 1:

```bash
docker compose up -d postgres redis minio
```

Terminal 2:

```bash
pnpm dev
```

Expected: API listens on port 4000, Web listens on port 3000, and Admin listens on port 3001.

- [ ] **Step 9: Verify HTTP endpoints**

Run:

```bash
curl http://localhost:4000/api/health
curl http://localhost:3000
curl http://localhost:3001
```

Expected:

- API response contains `"status":"ok"` and `"service":"api"`.
- Web response contains `技术讨论与社区分享`.
- Admin response contains `管理后台`.

- [ ] **Step 10: Stop development services**

Stop `pnpm dev` with `Ctrl+C`, then run:

```bash
docker compose down
```

Expected: Docker stops local infrastructure containers.

- [ ] **Step 11: Commit verification cleanup if generated files changed**

Run:

```bash
git status --short
```

Expected: generated folders such as `.next`, `dist`, `coverage`, and `.turbo` are ignored. If `pnpm-lock.yaml` changed during verification, commit it with:

```bash
git add pnpm-lock.yaml
git commit -m "维护：刷新工作区锁定文件"
```
