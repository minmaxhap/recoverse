import type { Kind } from '@recoverse/shared';

/**
 * 질문 추천 — 상황(kind) × 난이도별 큐레이션 질문 팩 (스펙 §1.2, Phase 2 항목 1).
 * AI 없이 로컬 큐레이션으로 시작. 나중에 키가 생기면 같은 자리에 AI 추천을 얹는다.
 */

export type Difficulty = 'light' | 'medium' | 'deep';

export const DIFFICULTIES: Difficulty[] = ['light', 'medium', 'deep'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  light: '가볍게',
  medium: '적당히',
  deep: '깊게',
};

/** 난이도별 한 문항에 답하는 데 걸리는 대략 시간(분). 빈 목차 앞의 부담을 미리 가늠하게 한다. */
const MINUTES_PER_QUESTION: Record<Difficulty, number> = { light: 1, medium: 2, deep: 3 };

/** 문항 수 × 난이도로 예상 작성 시간(분)을 추정한다. 0문항이면 0. */
export function estimateWritingMinutes(difficulty: Difficulty, questionCount: number): number {
  return Math.max(0, questionCount) * MINUTES_PER_QUESTION[difficulty];
}

type Pack = Record<Difficulty, string[]>;

/** 모든 kind에 공통으로 섞을 수 있는 회고 질문 */
const GENERAL: Pack = {
  light: [
    '요즘 가장 자주 웃게 되는 순간은?',
    '최근에 새로 시작한 것이 있다면?',
    '요즘 나를 편하게 해주는 사소한 습관은?',
    '이번 주에 가장 잘 챙겨 먹은 한 끼는?',
  ],
  medium: [
    '올해의 나를 색 하나로 표현한다면?',
    '스스로에게 가장 자주 했던 말은?',
    '올해 가장 자주 만난 사람은 누구고, 왜였을까?',
    '지난 몇 달 동안 가장 크게 바뀐 생각이 있다면?',
  ],
  deep: [
    '지금의 나를 만든 올해의 결정적 장면은?',
    '두려워서 미뤄온 것이 있다면, 그건 무엇일까?',
    '내가 나에게 아직 하지 못한 말이 있다면?',
    '지금 놓아주어야 할 것이 있다면 무엇일까?',
  ],
};

const PACKS: Partial<Record<Kind, Pack>> = {
  yearend: {
    light: [
      '올해의 나를 이모지 하나로 표현한다면?',
      '올해 가장 자주 들은 노래는?',
      '올해 산 것 중 가장 잘 산 물건은?',
      '올해의 나를 한 단어로 요약하면?',
    ],
    medium: [
      '올해 가장 잘한 선택은?',
      '올해의 나를 건물 하나로 표현한다면?',
      '올해 가장 고마웠던 사람과 그 이유는?',
      '내년에는 덜 하고 싶은 것 하나는?',
    ],
    deep: [
      '올해 가장 크게 성장한 부분은 무엇이고, 무엇이 그렇게 만들었을까?',
      '내년의 나에게 한 문장을 남긴다면?',
      '올해 가장 후회하는 순간과, 다시 돌아간다면 할 선택은?',
      '올 한 해를 한 문장으로 정의한다면?',
    ],
  },
  travel: {
    light: [
      '이번 여행에서 가장 맛있었던 한 끼는?',
      '가장 오래 기억에 남을 장면은?',
      '다음에 또 가고 싶은 곳 하나는?',
      '여행 중 가장 많이 찍은 사진의 주제는?',
    ],
    medium: [
      '이번 여행이 나에게 남긴 한 가지는?',
      '여행 전과 후의 나, 무엇이 달라졌을까?',
      '함께 간 사람에 대해 새로 알게 된 점은?',
      '계획대로 안 됐지만 오히려 좋았던 순간은?',
    ],
    deep: [
      '이 여행을 떠나기로 한 진짜 이유는 무엇이었을까?',
      '낯선 곳에서 마주한 나의 새로운 모습은?',
      '돌아온 일상에서 이어가고 싶은 여행의 감각은?',
      '이 여행이 없었다면 몰랐을 나에 대한 사실은?',
    ],
  },
  monthly: {
    light: [
      '이번 달 가장 좋았던 하루는?',
      '이번 달 새로 생긴 습관이나 취미는?',
      '이번 달 나를 웃게 한 사람은?',
      '다음 달에 꼭 해보고 싶은 것 하나는?',
    ],
    medium: [
      '이번 달 나에게 준 가장 좋은 선물은?',
      '이번 달 가장 에너지를 많이 쓴 일은?',
      '이번 달 반복된 고민이 있다면?',
      '지난달의 다짐, 이번 달엔 어떻게 됐을까?',
    ],
    deep: [
      '이번 달의 나를 한 문장으로 정리한다면?',
      '이번 달 내가 외면했던 감정이 있다면?',
      '다음 달의 나에게 지금 꼭 해주고 싶은 말은?',
      '이번 달, 무엇을 배웠다고 말할 수 있을까?',
    ],
  },
  project: {
    light: [
      '이 프로젝트에서 가장 뿌듯했던 순간은?',
      '함께한 사람에게 전하고 싶은 한마디는?',
      '이 일을 시작할 때의 첫 마음은?',
      '가장 오래 붙잡았던 문제는 무엇이었나?',
    ],
    medium: [
      '이 프로젝트가 나에게 남긴 가장 큰 배움은?',
      '다시 한다면 바꾸고 싶은 한 가지는?',
      '예상과 가장 달랐던 부분은?',
      '이 과정에서 새로 발견한 나의 강점은?',
    ],
    deep: [
      '이 프로젝트의 성공/실패를 나는 어떻게 정의하고 싶은가?',
      '가장 힘들었던 순간을 버티게 한 것은 무엇이었을까?',
      '이 경험이 다음 선택에 어떤 영향을 줄까?',
      '끝난 지금, 이 일이 나에게 어떤 의미로 남는가?',
    ],
  },
  reading: {
    light: [
      '이 책에서 가장 밑줄 긋고 싶었던 문장은?',
      '가장 기억에 남는 인물이나 장면은?',
      '이 책을 누구에게 추천하고 싶은가?',
      '책을 덮고 가장 먼저 든 생각은?',
    ],
    medium: [
      '이 책이 나의 어떤 생각을 흔들었을까?',
      '읽기 전과 후, 무엇이 달라졌나?',
      '나였다면 다르게 했을 인물의 선택은?',
      '이 책의 질문을 한 문장으로 옮긴다면?',
    ],
    deep: [
      '이 책이 지금의 나에게 도착한 이유가 있다면?',
      '책 속 어떤 문장이 나의 삶에 말을 걸었나?',
      '이 책을 읽고 바꾸고 싶어진 것이 있다면?',
      '나는 이 이야기의 어느 지점에서 나를 보았을까?',
    ],
  },
  couple: {
    light: [
      '최근 서로에게 가장 고마웠던 순간은?',
      '함께한 시간 중 가장 자주 떠오르는 장면은?',
      '요즘 상대의 어떤 점이 새삼 좋은가?',
      '다음에 둘이 꼭 해보고 싶은 것은?',
    ],
    medium: [
      '올해 우리가 함께 넘어온 가장 큰 산은?',
      '서로에 대해 올해 새로 알게 된 점은?',
      '우리가 더 잘하고 싶은 한 가지는?',
      '상대에게 아직 못 한 고마운 말이 있다면?',
    ],
    deep: [
      '내가 생각하는 우리 관계의 가장 단단한 부분은?',
      '앞으로 함께 지켜가고 싶은 약속 하나는?',
      '상대에게 더 솔직해지고 싶은 부분이 있다면?',
      '우리는 서로에게 어떤 사람이 되어가고 있을까?',
    ],
  },
  free: GENERAL,
};

/**
 * 상황·난이도에 맞는 질문 후보를 셔플해서 최대 count개 반환.
 * exclude(이미 나온 질문)는 정규화 비교로 제외.
 */
export function suggestQuestions(
  kind: Kind,
  difficulty: Difficulty,
  exclude: string[] = [],
  count = 4,
): string[] {
  const pack = PACKS[kind] ?? GENERAL;
  // 해당 kind 질문 + 일반 질문을 함께 후보로 (free/미정 kind도 자연스럽게)
  const pool = [...pack[difficulty], ...GENERAL[difficulty]];
  const seen = new Set(exclude.map(normalize));
  const unique: string[] = [];
  const usedKeys = new Set<string>();
  for (const q of pool) {
    const key = normalize(q);
    if (seen.has(key) || usedKeys.has(key)) continue;
    usedKeys.add(key);
    unique.push(q);
  }
  return shuffle(unique).slice(0, count);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s?.!,~…·'"']/g, '');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
