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

interface AdminRequestOptions {
  cookie?: string;
  fetcher?: AdminFetch;
  baseUrl?: string;
}

interface NormalizedAdminRequestOptions {
  cookie: string;
  fetcher: AdminFetch;
  baseUrl?: string | undefined;
}

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

export async function fetchAdminDashboard(fetcher?: AdminFetch, baseUrl?: string): Promise<DashboardResponse>;
export async function fetchAdminDashboard(options?: AdminRequestOptions): Promise<DashboardResponse>;
export async function fetchAdminDashboard(first?: AdminFetch | AdminRequestOptions, baseUrl?: string): Promise<DashboardResponse> {
  return requestJson<DashboardResponse>("/admin/dashboard", normalizeRequestOptions(first, baseUrl));
}

export async function fetchAdminReports(fetcher?: AdminFetch, baseUrl?: string): Promise<ReportSummary[]>;
export async function fetchAdminReports(options?: AdminRequestOptions): Promise<ReportSummary[]>;
export async function fetchAdminReports(first?: AdminFetch | AdminRequestOptions, baseUrl?: string): Promise<ReportSummary[]> {
  const response = await requestJson<ReportsResponse>("/admin/reports", normalizeRequestOptions(first, baseUrl));
  return response.reports;
}

export async function fetchAdminThreads(fetcher?: AdminFetch, baseUrl?: string): Promise<ThreadSummary[]>;
export async function fetchAdminThreads(options?: AdminRequestOptions): Promise<ThreadSummary[]>;
export async function fetchAdminThreads(first?: AdminFetch | AdminRequestOptions, baseUrl?: string): Promise<ThreadSummary[]> {
  const response = await requestJson<ThreadsResponse>("/admin/threads", normalizeRequestOptions(first, baseUrl));
  return response.threads;
}

export async function fetchAdminUsers(fetcher?: AdminFetch, baseUrl?: string): Promise<AdminUserSummary[]>;
export async function fetchAdminUsers(options?: AdminRequestOptions): Promise<AdminUserSummary[]>;
export async function fetchAdminUsers(first?: AdminFetch | AdminRequestOptions, baseUrl?: string): Promise<AdminUserSummary[]> {
  const response = await requestJson<UsersResponse>("/admin/users", normalizeRequestOptions(first, baseUrl));
  return response.users;
}

export async function fetchAdminBoards(fetcher?: AdminFetch, baseUrl?: string): Promise<BoardSummary[]>;
export async function fetchAdminBoards(options?: AdminRequestOptions): Promise<BoardSummary[]>;
export async function fetchAdminBoards(first?: AdminFetch | AdminRequestOptions, baseUrl?: string): Promise<BoardSummary[]> {
  const response = await requestJson<BoardsResponse>("/admin/boards", normalizeRequestOptions(first, baseUrl));
  return response.boards;
}

export async function fetchAdminTags(fetcher?: AdminFetch, baseUrl?: string): Promise<TagSummary[]>;
export async function fetchAdminTags(options?: AdminRequestOptions): Promise<TagSummary[]>;
export async function fetchAdminTags(first?: AdminFetch | AdminRequestOptions, baseUrl?: string): Promise<TagSummary[]> {
  const response = await requestJson<TagsResponse>("/admin/tags", normalizeRequestOptions(first, baseUrl));
  return response.tags;
}

function normalizeRequestOptions(first?: AdminFetch | AdminRequestOptions, baseUrl?: string): NormalizedAdminRequestOptions {
  if (typeof first === "function") {
    return {
      cookie: "",
      fetcher: first,
      baseUrl
    };
  }

  return {
    cookie: first?.cookie ?? "",
    fetcher: first?.fetcher ?? defaultFetch,
    baseUrl: first?.baseUrl
  };
}

async function requestJson<T>(
  path: string,
  options: NormalizedAdminRequestOptions
): Promise<T> {
  const init: RequestInit = {
    credentials: "include"
  };

  if (options.cookie) {
    init.headers = { cookie: options.cookie };
  }

  const response = await options.fetcher(`${resolveAdminApiBaseUrl(options.baseUrl)}${path}`, init);

  if (!response.ok) {
    throw new Error(`Admin API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
