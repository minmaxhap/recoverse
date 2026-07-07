import type { Issue } from '@recoverse/shared';

/** 다시 발견을 체험할 예시 지난 호 3권 (프로토타입 카피 그대로) */
export function sampleIssues(): Issue[] {
  const mk = (year: number, a1: string, a2: string, b1: string, b2: string): Issue => ({
    id: `sample-${year}`,
    kind: 'yearend',
    date: `${year}-12-31`,
    title: `${year} 연말호 (예시)`,
    participants: ['민희', '지원'],
    source: 'import',
    rounds: [
      { asker: '지원', question: '올해 가장 잘한 선택은?', answers: { 민희: { text: a1 }, 지원: { text: a2 } } },
      { asker: '민희', question: '내년의 나에게 한 문장을 남긴다면?', answers: { 민희: { text: b1 }, 지원: { text: b2 } } },
    ],
  });
  return [
    mk(2016, '고민만 하던 스터디를 결국 시작한 것.', '이 회고를 하자고 한 것!', '겁내지 말고 일단 만들어봐.', '건강 챙기면서 가자.'),
    mk(2019, '이직. 무서웠지만 배우는 게 훨씬 많았다.', '혼자 떠난 첫 여행.', '완벽하지 않아도 공유하자.', '기록을 미루지 말자.'),
    mk(2022, '사이드 프로젝트를 끝까지 배포한 것.', '운동을 습관으로 만든 것.', '속도보다 방향.', '좋아하는 걸 더 자주 말하자.'),
  ];
}

export const SAMPLE_ID_PREFIX = 'sample-';

export function isSample(issue: Issue): boolean {
  return issue.id.startsWith(SAMPLE_ID_PREFIX);
}
