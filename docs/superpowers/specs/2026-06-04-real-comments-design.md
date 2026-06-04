# 真实评论功能一期设计文档

日期：2026-06-04

## 背景

当前项目已经完成用户注册登录、分区浏览、主题列表、主题详情和登录后发帖。主题详情页已经改造成 GitHub Discussions 风格的 timeline，但评论内容仍由前端 `getDemoComments()` 静态生成。数据库 schema 中已经存在 `Comment` 模型，演示 SQL 也写入了评论数据，但后端没有评论读取/创建接口，前端也没有真实提交评论的表单。

本期目标是把“评论 UI 演示流”升级为“真实评论功能 MVP”，让主题详情页展示数据库评论，并允许登录用户发表评论。

## 目标

- 主题详情 API 返回该主题下的真实评论列表。
- 登录用户可以在主题详情页提交一条顶层评论。
- 未登录用户在回复区看到登录入口，而不是可提交表单。
- 评论提交成功后刷新当前主题详情，新的评论出现在 timeline 中。
- README 明确说明评论功能已接入，同时列出仍未实现的编辑、订阅、搜索、筛选等占位功能。
- 保持现有 GitHub 风格详情页视觉，不引入新的页面风格。

## 非目标

- 不实现楼中楼回复。虽然 `Comment.parentId` 已经存在，本期只做顶层评论。
- 不实现评论编辑、删除、隐藏、审核、举报。
- 不实现点赞、收藏、订阅、通知。
- 不实现 Markdown 完整解析器，只沿用当前轻量的内联 code span 显示。
- 不实现评论分页。主题详情一次返回该主题的全部评论，适合课程演示数据规模。
- 不实现实时更新或乐观更新，提交成功后使用页面刷新拿最新数据。

## 用户体验

游客打开主题详情页时：

- 能看到原帖正文和数据库中的评论 timeline。
- 回复区显示“登录后参与评论”和登录按钮。
- 点击登录按钮进入 `/login`。

已登录用户打开主题详情页时：

- 回复区显示 textarea 和 `发表评论` 按钮。
- 输入少于 1 个字符或超过 5000 个字符时由前后端校验阻止提交。
- 提交中按钮显示 `发表中...` 并禁用。
- 提交成功后清空输入并刷新当前详情页。
- 提交失败时在表单内显示错误信息。

评论 timeline：

- 原帖继续作为第一条 comment card 展示。
- 后续真实评论按创建时间升序展示。
- 每条评论显示作者头像首字母、作者名、评论时间和正文。
- 评论区为空时显示轻量空状态，不使用插画。

## 数据设计

复用现有 Prisma `Comment` 模型：

```prisma
model Comment {
  id        String   @id @default(cuid())
  threadId  String
  thread    Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  parentId  String?
  body      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

本期不新增数据库表，也不修改 migration。创建评论时同时更新对应主题的 `updatedAt`，让主题列表后续可以按最近活跃排序。

## 共享类型

在 `packages/shared/src/index.ts` 中新增：

```ts
export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000)
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export interface CommentSummary {
  id: string;
  threadId: string;
  authorId: string;
  authorUsername: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}
```

并把 `ThreadDetail` 扩展为：

```ts
export interface ThreadDetail extends Omit<ThreadSummary, "excerpt"> {
  body: string;
  comments: CommentSummary[];
}
```

## API 设计

### 获取主题详情

`GET /api/threads/:id`

返回：

```ts
{
  thread: ThreadDetail;
}
```

要求：

- 只返回 `PUBLISHED` 主题。
- `comments` 只包含顶层评论，即 `parentId: null`。
- 评论按 `createdAt asc` 排序。
- 评论包含作者用户名。

### 创建评论

`POST /api/threads/:id/comments`

请求体：

```json
{
  "body": "评论内容"
}
```

要求：

- 必须登录，复用 `SessionGuard`。
- 主题不存在或非 `PUBLISHED` 时返回 404。
- 请求体使用 `createCommentSchema` 校验。
- 创建成功后返回：

```ts
{
  comment: CommentSummary;
}
```

## 前端设计

前端 API client 新增：

```ts
export async function createComment(
  threadId: string,
  input: CreateCommentInput,
  fetcher?: ForumFetch,
  baseUrl?: string
): Promise<CommentSummary>;
```

主题详情页调整：

- 删除 `getDemoComments()`、`DemoComment` 和演示参与者逻辑。
- 使用 `thread.comments` 渲染真实评论。
- 参与者由 `thread.authorUsername` 和 `thread.comments[].authorUsername` 去重得到。
- `CommentComposer` 改为 client component，进入页面后调用 `getCurrentUser()` 判断登录状态。
- 未登录显示登录入口；已登录显示 textarea 和提交按钮。
- 提交评论调用 `createComment(thread.id, { body })`，成功后 `router.refresh()`。

## 错误处理

- 未登录提交时后端返回 401，前端显示“请先登录后再发表评论。”并保留登录入口。
- 主题不存在时沿用现有“主题不存在”状态。
- API 连接失败时沿用现有“主题暂时不可用”状态。
- 评论提交失败时表单内显示错误信息，不跳转。

## 测试策略

共享包：

- `createCommentSchema` 接受 1 到 5000 字符。
- 空字符串和超长正文校验失败。
- `ThreadDetail` fixture 必须包含 `comments`。

API：

- `GET /api/threads/:id` 返回真实评论，按创建时间升序。
- `POST /api/threads/:id/comments` 未登录返回 401。
- 登录用户可以创建评论。
- 给不存在或隐藏主题评论返回 404。
- 创建评论后主题 `updatedAt` 被刷新。

Web：

- forum API client 能创建评论并带上 `credentials: "include"`。
- 详情页用 `thread.comments` 渲染 timeline，不再显示演示回复文案。
- 未登录回复区显示登录入口。
- 已登录回复区显示 textarea 和 `发表评论` 按钮。
- 提交成功后调用 `router.refresh()`。

## 验收标准

- 导入演示 SQL 后，主题详情页展示 SQL 中的真实评论。
- 登录演示账号后，可以在任一主题详情页发表评论。
- 新评论刷新后保留在数据库中，并出现在该主题 timeline 底部。
- 页面上不再出现“演示回复用于呈现讨论流”。
- README 能清楚区分已实现评论功能和仍然占位的搜索、筛选、编辑、订阅等功能。
