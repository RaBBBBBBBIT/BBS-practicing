import type {
  AuthSessionResponse,
  BoardSummary,
  CommentSummary,
  ConversationSummary,
  CreateCommentInput,
  CreateConversationMessageInput,
  CreateReportInput,
  CreateThreadInput,
  LoginInput,
  MessageSummary,
  NotificationSummary,
  PublicUser,
  RegisterInput,
  ReportSummary,
  TagSummary,
  ThreadDetail,
  ThreadSummary,
  UpdateThreadInput,
  UserProfileSummary
} from "@bbs/shared";

const DEFAULT_API_BASE_URL = "http://localhost:4000/api";

type ForumFetch = (input: string, init?: RequestInit) => Promise<Response>;
const defaultFetch: ForumFetch = (input, init) => globalThis.fetch(input, init);

interface BoardsResponse {
  boards: BoardSummary[];
}

interface ThreadsResponse {
  threads: ThreadSummary[];
}

interface ThreadResponse {
  thread: ThreadSummary;
}

interface ThreadDetailResponse {
  thread: ThreadDetail;
}

interface CommentResponse {
  comment: CommentSummary;
}

interface NotificationsResponse {
  notifications: NotificationSummary[];
}

interface NotificationResponse {
  notification: NotificationSummary;
}

interface ConversationsResponse {
  conversations: ConversationSummary[];
}

interface MessagesResponse {
  messages: MessageSummary[];
}

interface SendMessageResponse {
  conversation: ConversationSummary;
  message: MessageSummary;
}

interface ReportResponse {
  report: ReportSummary;
}

interface TagsResponse {
  tags: TagSummary[];
}

interface UsersResponse {
  users: UserProfileSummary[];
}

interface UserResponse {
  user: UserProfileSummary;
}

export interface FetchThreadsOptions {
  boardSlug?: string | undefined;
  q?: string | undefined;
  tag?: string | undefined;
  status?: string | undefined;
  sort?: "latest" | "oldest" | "active" | "popular";
}

export function resolveApiBaseUrl(value = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL): string {
  return value.replace(/\/+$/, "");
}

export async function fetchBoards(fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<BoardSummary[]> {
  const response = await requestJson<BoardsResponse>("/boards", { fetcher, baseUrl });
  return response.boards;
}

export async function fetchThreads(
  options: FetchThreadsOptions = {},
  fetcher: ForumFetch = defaultFetch,
  baseUrl?: string
): Promise<ThreadSummary[]> {
  const query = createQueryString(options);
  const response = await requestJson<ThreadsResponse>(`/threads${query}`, { fetcher, baseUrl });
  return response.threads;
}

export async function fetchThread(id: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<ThreadDetail> {
  const response = await requestJson<ThreadDetailResponse>(`/threads/${encodeURIComponent(id)}`, { fetcher, baseUrl });
  return response.thread;
}

export async function getCurrentUser(fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<PublicUser | null> {
  const response = await fetcher(`${resolveApiBaseUrl(baseUrl)}/auth/me`, {
    credentials: "include"
  });

  if (response.status === 401) {
    return null;
  }

  await assertOk(response);
  const session = (await response.json()) as AuthSessionResponse;
  return session.user;
}

export async function registerUser(
  input: RegisterInput,
  fetcher: ForumFetch = defaultFetch,
  baseUrl?: string
): Promise<PublicUser> {
  const response = await requestJson<AuthSessionResponse>("/auth/register", {
    fetcher,
    baseUrl,
    method: "POST",
    body: input
  });
  return response.user;
}

export async function loginUser(input: LoginInput, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<PublicUser> {
  const response = await requestJson<AuthSessionResponse>("/auth/login", {
    fetcher,
    baseUrl,
    method: "POST",
    body: input
  });
  return response.user;
}

export async function logoutUser(fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<void> {
  const response = await fetcher(`${resolveApiBaseUrl(baseUrl)}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  await assertOk(response);
}

export async function createThread(
  input: CreateThreadInput,
  fetcher: ForumFetch = defaultFetch,
  baseUrl?: string
): Promise<ThreadSummary> {
  const response = await requestJson<ThreadResponse>("/threads", {
    fetcher,
    baseUrl,
    method: "POST",
    body: input
  });
  return response.thread;
}

export async function createComment(
  threadId: string,
  input: CreateCommentInput,
  fetcher: ForumFetch = defaultFetch,
  baseUrl?: string
): Promise<CommentSummary> {
  const response = await requestJson<CommentResponse>(`/threads/${encodeURIComponent(threadId)}/comments`, {
    fetcher,
    baseUrl,
    method: "POST",
    body: input
  });
  return response.comment;
}

export async function updateThread(
  threadId: string,
  input: UpdateThreadInput,
  fetcher: ForumFetch = defaultFetch,
  baseUrl?: string
): Promise<ThreadDetail> {
  const response = await requestJson<ThreadDetailResponse>(`/threads/${encodeURIComponent(threadId)}`, {
    fetcher,
    baseUrl,
    method: "PATCH",
    body: input
  });
  return response.thread;
}

export async function reactToThread(threadId: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<ThreadSummary> {
  const response = await requestJson<ThreadResponse>(`/threads/${encodeURIComponent(threadId)}/reactions`, {
    fetcher,
    baseUrl,
    method: "POST"
  });
  return response.thread;
}

export async function removeThreadReaction(threadId: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<ThreadSummary> {
  const response = await requestJson<ThreadResponse>(`/threads/${encodeURIComponent(threadId)}/reactions`, {
    fetcher,
    baseUrl,
    method: "DELETE"
  });
  return response.thread;
}

export async function bookmarkThread(threadId: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<ThreadSummary> {
  const response = await requestJson<ThreadResponse>(`/threads/${encodeURIComponent(threadId)}/bookmarks`, {
    fetcher,
    baseUrl,
    method: "POST"
  });
  return response.thread;
}

export async function removeThreadBookmark(threadId: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<ThreadSummary> {
  const response = await requestJson<ThreadResponse>(`/threads/${encodeURIComponent(threadId)}/bookmarks`, {
    fetcher,
    baseUrl,
    method: "DELETE"
  });
  return response.thread;
}

export async function followUser(userId: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<UserProfileSummary> {
  const response = await requestJson<UserResponse>(`/users/${encodeURIComponent(userId)}/follow`, {
    fetcher,
    baseUrl,
    method: "POST"
  });
  return response.user;
}

export async function unfollowUser(userId: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<UserProfileSummary> {
  const response = await requestJson<UserResponse>(`/users/${encodeURIComponent(userId)}/follow`, {
    fetcher,
    baseUrl,
    method: "DELETE"
  });
  return response.user;
}

export async function createReport(input: CreateReportInput, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<ReportSummary> {
  const response = await requestJson<ReportResponse>("/reports", {
    fetcher,
    baseUrl,
    method: "POST",
    body: input
  });
  return response.report;
}

export async function fetchNotifications(fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<NotificationSummary[]> {
  const response = await requestJson<NotificationsResponse>("/notifications", { fetcher, baseUrl });
  return response.notifications;
}

export async function markNotificationRead(id: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<NotificationSummary> {
  const response = await requestJson<NotificationResponse>(`/notifications/${encodeURIComponent(id)}/read`, {
    fetcher,
    baseUrl,
    method: "PATCH"
  });
  return response.notification;
}

export async function markAllNotificationsRead(fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<number> {
  const response = await requestJson<{ updatedCount: number }>("/notifications/read-all", {
    fetcher,
    baseUrl,
    method: "PATCH"
  });
  return response.updatedCount;
}

export async function fetchConversations(fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<ConversationSummary[]> {
  const response = await requestJson<ConversationsResponse>("/messages/conversations", { fetcher, baseUrl });
  return response.conversations;
}

export async function fetchConversationMessages(
  conversationId: string,
  fetcher: ForumFetch = defaultFetch,
  baseUrl?: string
): Promise<MessageSummary[]> {
  const response = await requestJson<MessagesResponse>(`/messages/conversations/${encodeURIComponent(conversationId)}`, {
    fetcher,
    baseUrl
  });
  return response.messages;
}

export async function sendMessage(
  input: CreateConversationMessageInput,
  fetcher: ForumFetch = defaultFetch,
  baseUrl?: string
): Promise<SendMessageResponse> {
  return requestJson<SendMessageResponse>("/messages", {
    fetcher,
    baseUrl,
    method: "POST",
    body: input
  });
}

export async function fetchTags(fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<TagSummary[]> {
  const response = await requestJson<TagsResponse>("/tags", { fetcher, baseUrl });
  return response.tags;
}

export async function fetchUsers(fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<UserProfileSummary[]> {
  const response = await requestJson<UsersResponse>("/users", { fetcher, baseUrl });
  return response.users;
}

export async function fetchUserProfile(username: string, fetcher: ForumFetch = defaultFetch, baseUrl?: string): Promise<UserProfileSummary> {
  const response = await requestJson<UserResponse>(`/users/${encodeURIComponent(username)}`, { fetcher, baseUrl });
  return response.user;
}

async function requestJson<T>(
  path: string,
  options: {
    fetcher: ForumFetch;
    baseUrl?: string | undefined;
    method?: "DELETE" | "GET" | "PATCH" | "POST" | undefined;
    body?: unknown;
  }
): Promise<T> {
  const init: RequestInit = {
    credentials: "include"
  };

  if (options.method) {
    init.method = options.method;
  }

  if (options.body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(options.body);
  }

  const response = await options.fetcher(`${resolveApiBaseUrl(options.baseUrl)}${path}`, init);
  await assertOk(response);
  return (await response.json()) as T;
}

function createQueryString(options: FetchThreadsOptions): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  throw new Error(`API request failed with status ${response.status}`);
}
