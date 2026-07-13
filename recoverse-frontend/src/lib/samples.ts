import type { Issue } from '@recoverse/shared';

const SAMPLE_OWNER = '나';

type SampleCopy = {
  readonly year: number;
  readonly firstAnswer: string;
  readonly secondAnswer: string;
};

export function sampleIssues(): Issue[] {
  const makeIssue = (copy: SampleCopy): Issue => ({
    id: `sample-${copy.year}`,
    kind: 'yearend',
    date: `${copy.year}-12-31`,
    title: `${copy.year} 연말호 (예시)`,
    participants: [SAMPLE_OWNER],
    source: 'import',
    rounds: [
      {
        asker: SAMPLE_OWNER,
        question: '올해 가장 잘한 선택은?',
        answers: { [SAMPLE_OWNER]: { text: copy.firstAnswer } },
      },
      {
        asker: SAMPLE_OWNER,
        question: '내년의 나에게 한 문장을 남긴다면?',
        answers: { [SAMPLE_OWNER]: { text: copy.secondAnswer } },
      },
    ],
  });

  return [
    makeIssue({
      year: 2016,
      firstAnswer: '고민만 하던 기록을 결국 시작한 것.',
      secondAnswer: '견뎌내려고만 하지 말고, 일단 작게 만들어보기.',
    }),
    makeIssue({
      year: 2019,
      firstAnswer: '무서웠지만 새로운 일을 배워본 것.',
      secondAnswer: '완벽하지 않아도 공유해보기.',
    }),
    makeIssue({
      year: 2022,
      firstAnswer: '사이드 프로젝트를 끝까지 배포한 것.',
      secondAnswer: '속도보다 방향을 자주 확인하기.',
    }),
  ];
}

export const SAMPLE_ID_PREFIX = 'sample-';

export function isSample(issue: Issue): boolean {
  return issue.id.startsWith(SAMPLE_ID_PREFIX);
}
