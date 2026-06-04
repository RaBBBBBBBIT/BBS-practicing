import type {
  AdminDashboardSummary,
  AdminUserSummary,
  AuditLogSummary,
  BoardSummary,
  ReportSummary,
  TagSummary,
  ThreadSummary
} from "@bbs/shared";

const DEFAULT_API_BASE_URL = "http://localhost:4000/api";
type AdminFetch = (input: string, init?: RequestInit) => Promise<Response>;
const defaultFetch: AdminFetch = (input, init) => globalThis.fetch(input, init);

interface DashboardResponse {
  dashboard: AdminDashboardSummary;
  auditLogs: AuditLogSummary[];
}

interface ReportsResponse {
  reports: ReportSummary[];
}

interface ThreadsResponse {
  threads: ThreadSummary[];
}

interface UsersResponse {
  users: AdminUserSummary[];
}

interface BoardsResponse {
  boards: BoardSummary[];
}

interface TagsResponse {
  tags: TagSummary[];
}

export function resolveAdminApiBaseUrl(value = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL): string {
  return value.replace(/\/+$/, "");
}

export async function fetchAdminDashboard(fetcher: AdminFetch = defaultFetch, baseUrl?: string): Promise<DashboardResponse> {
  return requestJson<DashboardResponse>("/admin/dashboard", { fetcher, baseUrl });
}

export async function fetchAdminReports(fetcher: AdminFetch = defaultFetch, baseUrl?: string): Promise<ReportSummary[]> {
  const response = await requestJson<ReportsResponse>("/admin/reports", { fetcher, baseUrl });
  return response.reports;
}

export async function fetchAdminThreads(fetcher: AdminFetch = defaultFetch, baseUrl?: string): Promise<ThreadSummary[]> {
  const response = await requestJson<ThreadsResponse>("/admin/threads", { fetcher, baseUrl });
  return response.threads;
}

export async function fetchAdminUsers(fetcher: AdminFetch = defaultFetch, baseUrl?: string): Promise<AdminUserSummary[]> {
  const response = await requestJson<UsersResponse>("/admin/users", { fetcher, baseUrl });
  return response.users;
}

export async function fetchAdminBoards(fetcher: AdminFetch = defaultFetch, baseUrl?: string): Promise<BoardSummary[]> {
  const response = await requestJson<BoardsResponse>("/admin/boards", { fetcher, baseUrl });
  return response.boards;
}

export async function fetchAdminTags(fetcher: AdminFetch = defaultFetch, baseUrl?: string): Promise<TagSummary[]> {
  const response = await requestJson<TagsResponse>("/admin/tags", { fetcher, baseUrl });
  return response.tags;
}

async function requestJson<T>(
  path: string,
  options: {
    fetcher: AdminFetch;
    baseUrl?: string | undefined;
  }
): Promise<T> {
  const response = await options.fetcher(`${resolveAdminApiBaseUrl(options.baseUrl)}${path}`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Admin API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
