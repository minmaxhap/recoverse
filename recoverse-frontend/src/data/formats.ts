/**
 * 회고 포맷 (스펙 §1.3 / Phase 3 항목 1 — 텍스트 기반 포맷부터).
 * Round.format(포맷 ID)에 저장되고, 열람 화면이 이 정의로 답변을 특별하게 조판한다.
 */

export type FormatKind = 'keyword' | 'scenes' | 'letter';

export interface ReflectionFormat {
  id: string;
  label: string; // 칩 라벨
  prompt: string; // 이 포맷의 고정 질문
  hint: string; // 답변 입력 placeholder
  kind: FormatKind; // 렌더 방식
}

export const FORMATS: ReflectionFormat[] = [
  {
    id: 'year-keyword',
    label: '올해의 키워드',
    prompt: '올해를 한 단어로 남긴다면?',
    hint: '한 단어 (예: 도약, 회복, 시작)',
    kind: 'keyword',
  },
  {
    id: 'three-scenes',
    label: '올해의 세 장면',
    prompt: '올해의 세 장면을 꼽는다면?',
    hint: '세 장면을 한 줄에 하나씩 (엔터로 구분)',
    kind: 'scenes',
  },
  {
    id: 'letter-future',
    label: '미래의 나에게 편지',
    prompt: '미래의 나에게 편지를 쓴다면?',
    hint: '미래의 나에게…',
    kind: 'letter',
  },
];

export function getFormat(id: string | undefined): ReflectionFormat | undefined {
  if (!id) return undefined;
  return FORMATS.find((f) => f.id === id);
}

/** "세 장면" 답변 텍스트를 최대 3개의 장면으로 분해 */
export function splitScenes(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}
