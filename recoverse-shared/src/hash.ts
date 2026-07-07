import type { Answer } from './model';

/** FNV-1a 32bit — 모든 JS 엔진에서 동일한 결과 (charCodeAt 기반) */
export function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export const GUESS_LABELS = ['가', '나', '다', '라', '마', '바', '사', '아'] as const;

/**
 * 누가 썼게 — 익명 답변의 결정적 셔플.
 * hash(code:roundIdx:답변텍스트) 정렬이므로 전 기기에서 순서가 동일하다.
 * 동일 텍스트는 해시가 같으므로 owner 이름 타이브레이크 필수.
 */
export function shuffledAnswerOrder(
  code: string,
  roundIdx: number,
  answers: Record<string, Answer>,
): { owner: string; label: string }[] {
  return Object.entries(answers)
    .map(([owner, a]) => ({ owner, key: fnv1a32(`${code}:${roundIdx}:${a.text}`) }))
    .sort((x, y) => x.key - y.key || (x.owner < y.owner ? -1 : 1))
    .map((e, i) => ({ owner: e.owner, label: GUESS_LABELS[i] ?? `${i + 1}` }));
}
