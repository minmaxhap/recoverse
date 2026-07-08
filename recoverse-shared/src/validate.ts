import { KINDS, type Kind } from './model';

/* 세션 코드: 4자리, [A-HJ-NP-Z2-9] — I·O·0·1 제외 (스펙 §3) */
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_RE = /^[A-HJ-NP-Z2-9]{4}$/;

export const NAME_MAX = 12;
export const QUESTION_MAX = 200;
export const ANSWER_MAX = 2000;
export const TITLE_MAX = 60;

/* 공유 ID: 12바이트(96bit) 랜덤 hex — 링크를 아는 사람만 열람하므로 추측 불가해야 함 */
export const SHARE_ID_RE = /^[a-f0-9]{24}$/;

export function isValidCode(code: string): boolean {
  return CODE_RE.test(code);
}

export function isValidShareId(id: string): boolean {
  return SHARE_ID_RE.test(id);
}

/** 이름: 1~12자, 키 구분자(:)와 개행 금지 */
export function isValidName(name: string): boolean {
  return name.length >= 1 && name.length <= NAME_MAX && !/[:\n\r]/.test(name);
}

export function isValidQuestion(q: string): boolean {
  return q.length >= 1 && q.length <= QUESTION_MAX;
}

export function isValidAnswerText(t: string): boolean {
  return t.length >= 1 && t.length <= ANSWER_MAX;
}

export function isKind(v: unknown): v is Kind {
  return typeof v === 'string' && (KINDS as string[]).includes(v);
}
