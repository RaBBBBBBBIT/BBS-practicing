import type {
  AuthSessionResponse,
  BoardSummary,
  CreateThreadInput,
  LoginInput,
  PublicUser,
  RegisterInput,
  ThreadDetail,
  ThreadSummary
} from "@bbs/shared";

const DEFAULT_API_BASE_URL = "http://localhost:4000/api";

type ForumFetch = (input: string, init?: RequestInit) => Promise<Response>;

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

export interface FetchThreadsOptions {
  boardSlug?: string;
}

export function resolveApiBaseUrl(value = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL): string {
  return value.replace(/\/+$/, "");
}

export async function fetchBoards(fetcher: ForumFetch = fetch, baseUrl?: string): Promise<BoardSummary[]> {
  const response = await requestJson<BoardsResponse>("/boards", { fetcher, baseUrl });
  return response.boards;
}

export async function fetchThreads(
  options: FetchThreadsOptions = {},
  fetcher: ForumFetch = fetch,
  baseUrl?: string
): Promise<ThreadSummary[]> {
  const query = options.boardSlug ? `?boardSlug=${encodeURIComponent(options.boardSlug)}` : "";
  const response = await requestJson<ThreadsResponse>(`/threads${query}`, { fetcher, baseUrl });
  return response.threads;
}

export async function fetchThread(id: string, fetcher: ForumFetch = fetch, baseUrl?: string): Promise<ThreadDetail> {
  const response = await requestJson<ThreadDetailResponse>(`/threads/${encodeURIComponent(id)}`, { fetcher, baseUrl });
  return response.thread;
}

export async function getCurrentUser(fetcher: ForumFetch = fetch, baseUrl?: string): Promise<PublicUser | null> {
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
  fetcher: ForumFetch = fetch,
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

export async function loginUser(input: LoginInput, fetcher: ForumFetch = fetch, baseUrl?: string): Promise<PublicUser> {
  const response = await requestJson<AuthSessionResponse>("/auth/login", {
    fetcher,
    baseUrl,
    method: "POST",
    body: input
  });
  return response.user;
}

export async function logoutUser(fetcher: ForumFetch = fetch, baseUrl?: string): Promise<void> {
  const response = await fetcher(`${resolveApiBaseUrl(baseUrl)}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  await assertOk(response);
}

export async function createThread(
  input: CreateThreadInput,
  fetcher: ForumFetch = fetch,
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

async function requestJson<T>(
  path: string,
  options: {
    fetcher: ForumFetch;
    baseUrl?: string | undefined;
    method?: "GET" | "POST" | undefined;
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

async function assertOk(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }

  throw new Error(`API request failed with status ${response.status}`);
}
