import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import type { Kind, Round, SoloMode } from '@recoverse/shared';
import type { SoloIssueCurrentRoundDraft } from './useSoloIssueDraft';
import { useSoloIssuePresentation } from './useSoloIssuePresentation';

function presentationFixture() {
  const kind = ref<Kind>('yearend');
  const date = ref('2026-08-18');
  const mode = ref<SoloMode | ''>('free');
  const title = ref('');
  const participants = ref<readonly string[]>(['Mina']);
  const rounds = ref<readonly Round[]>([]);
  const currentRound = ref<SoloIssueCurrentRoundDraft>({ question: '', formatId: '', answers: {} });
  const quickReady = ref(false);
  const presentation = useSoloIssuePresentation({
    kind,
    date,
    mode,
    title,
    participants,
    rounds,
    currentRound,
    quickReady,
  });
  return { kind, date, mode, title, participants, rounds, currentRound, quickReady, presentation };
}

describe('useSoloIssuePresentation', () => {
  it.each([
    ['free', '2026 연말호', { asker: 'Mina', question: 'Free?', answers: { Mina: { text: '답' } } }],
    ['quick', '8월 18일의 장면', { asker: 'Mina', question: 'Today?', answers: { Mina: { text: '답' } }, pathId: 'solo-today' }],
    ['review', '사진 리뷰 · 8월 18일', {
      asker: 'Mina',
      question: 'Photo?',
      answers: { Mina: { text: '답' } },
      review: { lensId: 'photo', lensRevision: 1, scope: { type: 'recent' } },
    }],
  ] satisfies readonly [SoloMode, string, Round][])('derives the existing %s default title', (mode, expected, round) => {
    const fixture = presentationFixture();
    fixture.mode.value = mode;
    fixture.rounds.value = [round];

    expect(fixture.presentation.defaultIssueTitle.value).toBe(expected);
    expect(fixture.presentation.issueTitle.value).toBe(expected);
  });

  it('keeps an explicit trimmed title ahead of the derived title', () => {
    const fixture = presentationFixture();
    fixture.title.value = '  직접 지은 제목  ';

    expect(fixture.presentation.issueTitle.value).toBe('직접 지은 제목');
  });

  it('counts answered and pending rounds with the shared answered semantics', () => {
    const fixture = presentationFixture();
    fixture.rounds.value = [
      { asker: 'Mina', question: 'Blank?', answers: { Mina: { text: '   ' } } },
      { asker: 'Mina', question: 'Answered?', answers: { Other: { text: '다른 참여자의 답' } } },
      { asker: 'Mina', question: 'Pending?', answers: {} },
    ];

    expect(fixture.presentation.answeredRounds.value.map((round) => round.question)).toEqual(['Answered?']);
    expect(fixture.presentation.answeredRoundCount.value).toBe(1);
    expect(fixture.presentation.pendingRoundCount.value).toBe(2);
    expect(fixture.presentation.canPublish.value).toBe(true);
  });

  it('returns the last non-empty answer for the solo participant with outer whitespace trimmed', () => {
    const fixture = presentationFixture();
    fixture.rounds.value = [
      { asker: 'Mina', question: 'First?', answers: { Mina: { text: '첫 답' } } },
      { asker: 'Mina', question: 'Other?', answers: { Other: { text: '남의 답' } } },
      { asker: 'Mina', question: 'Latest?', answers: { Mina: { text: '  마지막 답\n\n그대로  ' } } },
    ];

    expect(fixture.presentation.latestQuickAnswer.value).toBe('마지막 답\n\n그대로');
  });

  it('does not quote legacy rounds answered only by another participant', () => {
    const fixture = presentationFixture();
    fixture.rounds.value = [
      { asker: 'Other', question: 'Legacy?', answers: { Other: { text: '남의 답' } } },
    ];

    expect(fixture.presentation.latestQuickAnswer.value).toBe('');
  });

  it('explains publishing for zero answered, answered with pending, and all answered', () => {
    const fixture = presentationFixture();
    expect(fixture.presentation.publishHelp.value).toBe('질문 하나와 답 하나를 목차에 실으면 발행할 수 있어요.');

    fixture.rounds.value = [
      { asker: 'Mina', question: 'Answered?', answers: { Mina: { text: '답' } } },
      { asker: 'Mina', question: 'Pending?', answers: {} },
    ];
    expect(fixture.presentation.publishHelp.value).toBe(
      '지금 발행하면 답을 쓴 1개 질문만 실려요. 답 대기 중인 1개는 다음 호 초고로 남겨둬요.',
    );

    fixture.rounds.value = [
      { asker: 'Mina', question: 'Answered?', answers: { Mina: { text: '답' } } },
    ];
    expect(fixture.presentation.publishHelp.value).toBe('지금 발행하면 이 호가 내 책장에 저장돼요.');
  });

  it('finishes Quick only when ready with an answered round and an empty current question', () => {
    const fixture = presentationFixture();
    fixture.mode.value = 'quick';
    fixture.quickReady.value = true;
    expect(fixture.presentation.quickDone.value).toBe(false);

    fixture.rounds.value = [
      { asker: 'Mina', question: 'Answered?', answers: { Mina: { text: '답' } } },
    ];
    expect(fixture.presentation.quickDone.value).toBe(true);

    fixture.currentRound.value = { question: '다음 질문?', formatId: '', answers: {} };
    expect(fixture.presentation.quickDone.value).toBe(false);
    fixture.currentRound.value = { question: '', formatId: '', answers: {} };
    fixture.quickReady.value = false;
    expect(fixture.presentation.quickDone.value).toBe(false);
    fixture.quickReady.value = true;
    fixture.mode.value = 'free';
    expect(fixture.presentation.quickDone.value).toBe(false);
  });
});
