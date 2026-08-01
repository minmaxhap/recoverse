/**
 * 기본 제공 질문 세트 — 책장도 저장한 세트도 없는 첫 화면에서 백지를 면하게 하는 시작점.
 * 저장되지 않은 읽기 전용 묶음이라, 그대로 목차에 깔거나 편집기로 열어 내 세트로 만들 수 있다.
 * 질문은 questionPacks의 큐레이션에서 골라 "한 호 분량"으로 묶었다.
 */
export interface StarterSet {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly questions: readonly string[];
}

export const STARTER_SETS: readonly StarterSet[] = [
  {
    id: 'starter-yearend',
    name: '연말 결산 5문항',
    note: '한 해를 접으며',
    questions: [
      '올해의 나를 한 단어로 요약하면?',
      '올해 가장 잘한 선택은?',
      '올해 가장 고마웠던 사람과 그 이유는?',
      '올해 가장 크게 성장한 부분은 무엇이고, 무엇이 그렇게 만들었을까?',
      '내년의 나에게 한 문장을 남긴다면?',
    ],
  },
  {
    id: 'starter-monthly',
    name: '월간 회고 4문항',
    note: '매달 같은 질문으로',
    questions: [
      '이번 달 가장 좋았던 하루는?',
      '이번 달 가장 에너지를 많이 쓴 일은?',
      '이번 달 반복된 고민이 있다면?',
      '다음 달의 나에게 지금 꼭 해주고 싶은 말은?',
    ],
  },
  {
    id: 'starter-light',
    name: '가볍게 3문항',
    note: '오늘 10분이면',
    questions: [
      '요즘 가장 자주 웃게 되는 순간은?',
      '최근에 새로 시작한 것이 있다면?',
      '요즘 나를 편하게 해주는 사소한 습관은?',
    ],
  },
];
