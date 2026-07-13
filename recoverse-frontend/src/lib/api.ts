import type {
  ApiErrorBody,
  Issue,
  Kind,
  SessionEntryResponse,
  SessionStateResponse,
  VocCreateRequest,
  VocEntry,
  VocListResponse,
  VocStatus,
} from '@recoverse/shared';

const BASE = (import.meta.env.VITE_API_BASE ?? '') as string;
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'object' &&
    value.error !== null &&
    'code' in value.error &&
    'message' in value.error &&
    typeof value.error.code === 'string' &&
    typeof value.error.message === 'string'
  );
}

function parseJson(text: string): unknown {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError(0, 'bad_response', '서버 응답을 읽지 못했어요. 잠시 후 다시 시도해주세요.');
    }
    throw error;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'timeout', '응답이 늦어요. 네트워크를 확인하고 다시 시도해주세요.');
    }
    throw new ApiError(0, 'network', '연결에 실패했어요. 네트워크를 확인해주세요.');
  } finally {
    window.clearTimeout(timeoutId);
  }
  const text = await res.text();
  const data = parseJson(text);
  if (!res.ok) {
    if (isApiErrorBody(data)) {
      throw new ApiError(res.status, data.error.code, data.error.message);
    }
    throw new ApiError(res.status, 'unknown', '문제가 발생했어요.');
  }
  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export const api = {
  createSession: (host: string, kind: Kind) =>
    post<SessionEntryResponse>('/api/session', { host, kind }),
  join: (code: string, name: string) =>
    post<SessionEntryResponse>(`/api/session/${code}/join`, { name }),
  state: (code: string) =>
    request<SessionStateResponse>(`/api/session/${code}/state`),
  start: (code: string, name: string, playerToken: string) =>
    post<SessionStateResponse>(`/api/session/${code}/start`, { name, playerToken }),
  question: (code: string, name: string, playerToken: string, question: string, format?: string) =>
    post<SessionStateResponse>(`/api/session/${code}/question`, { name, playerToken, question, format }),
  answer: (code: string, name: string, playerToken: string, text: string) =>
    post<SessionStateResponse>(`/api/session/${code}/answer`, { name, playerToken, text }),
  guess: (code: string, name: string, playerToken: string, guesses: Record<string, string>) =>
    post<SessionStateResponse>(`/api/session/${code}/guess`, { name, playerToken, guesses }),
  reveal: (code: string, name: string, playerToken: string) =>
    post<SessionStateResponse>(`/api/session/${code}/reveal`, { name, playerToken }),
  next: (code: string, name: string, playerToken: string) =>
    post<SessionStateResponse>(`/api/session/${code}/next`, { name, playerToken }),
  end: (code: string, name: string, playerToken: string) =>
    post<SessionStateResponse>(`/api/session/${code}/end`, { name, playerToken }),

  // 읽기 전용 공유
  createShare: (issue: Issue) => post<{ shareId: string }>('/api/share', { issue }),
  getShare: (shareId: string) => request<{ issue: Issue }>(`/api/share/${shareId}`),
  submitVoc: (body: VocCreateRequest) => post<{ entry: VocEntry }>('/api/voc', body),
  listVoc: (token: string) => request<VocListResponse>('/api/admin/voc', { headers: { authorization: `Bearer ${token}` } }),
  updateVocStatus: (token: string, id: string, status: VocStatus) =>
    request<{ ok: true }>(`/api/admin/voc/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: { authorization: `Bearer ${token}` },
    }),
};
