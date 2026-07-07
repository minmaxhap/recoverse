import type { Kind, SessionStateResponse, ApiErrorBody } from '@recoverse/shared';

const BASE = (import.meta.env.VITE_API_BASE ?? '') as string;

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, 'network', '연결에 실패했어요. 네트워크를 확인해주세요.');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const body = data as ApiErrorBody;
    throw new ApiError(res.status, body.error?.code ?? 'unknown', body.error?.message ?? '문제가 발생했어요.');
  }
  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export const api = {
  createSession: (host: string, kind: Kind) =>
    post<SessionStateResponse>('/api/session', { host, kind }),
  join: (code: string, name: string) =>
    post<SessionStateResponse>(`/api/session/${code}/join`, { name }),
  state: (code: string) =>
    request<SessionStateResponse>(`/api/session/${code}/state`),
  start: (code: string, name: string) =>
    post<SessionStateResponse>(`/api/session/${code}/start`, { name }),
  question: (code: string, name: string, question: string) =>
    post<SessionStateResponse>(`/api/session/${code}/question`, { name, question }),
  answer: (code: string, name: string, text: string) =>
    post<SessionStateResponse>(`/api/session/${code}/answer`, { name, text }),
  guess: (code: string, name: string, guesses: Record<string, string>) =>
    post<SessionStateResponse>(`/api/session/${code}/guess`, { name, guesses }),
  reveal: (code: string, name: string) =>
    post<SessionStateResponse>(`/api/session/${code}/reveal`, { name }),
  next: (code: string, name: string) =>
    post<SessionStateResponse>(`/api/session/${code}/next`, { name }),
  end: (code: string, name: string) =>
    post<SessionStateResponse>(`/api/session/${code}/end`, { name }),
};
