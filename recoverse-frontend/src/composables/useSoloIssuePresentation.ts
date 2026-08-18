import { computed, type ComputedRef, type Ref } from 'vue';
import type { Kind, Round, SoloMode } from '@recoverse/shared';
import { roundIsAnswered } from '../lib/issueBuilder';
import { deriveSoloTitle } from '../lib/soloTitle';
import type { SoloIssueCurrentRoundDraft } from './useSoloIssueDraft';

export type SoloIssuePresentationInput = {
  readonly kind: Readonly<Ref<Kind>>;
  readonly date: Readonly<Ref<string>>;
  readonly mode: Readonly<Ref<SoloMode | ''>>;
  readonly title: Readonly<Ref<string>>;
  readonly participants: Readonly<Ref<readonly string[]>>;
  readonly rounds: Readonly<Ref<readonly Round[]>>;
  readonly currentRound: Readonly<Ref<SoloIssueCurrentRoundDraft>>;
  readonly quickReady: Readonly<Ref<boolean>>;
};

export type SoloIssuePresentation = {
  readonly answeredRounds: ComputedRef<readonly Round[]>;
  readonly defaultIssueTitle: ComputedRef<string>;
  readonly issueTitle: ComputedRef<string>;
  readonly answeredRoundCount: ComputedRef<number>;
  readonly pendingRoundCount: ComputedRef<number>;
  readonly canPublish: ComputedRef<boolean>;
  readonly latestQuickAnswer: ComputedRef<string>;
  readonly publishHelp: ComputedRef<string>;
  readonly quickDone: ComputedRef<boolean>;
};

export function useSoloIssuePresentation(input: SoloIssuePresentationInput): SoloIssuePresentation {
  const answeredRounds = computed(() => input.rounds.value.filter(roundIsAnswered));
  const defaultIssueTitle = computed(() =>
    deriveSoloTitle({
      kind: input.kind.value,
      date: input.date.value,
      mode: input.mode.value || 'free',
      answeredRounds: answeredRounds.value,
    }),
  );
  const issueTitle = computed(() => input.title.value.trim() || defaultIssueTitle.value);
  const answeredRoundCount = computed(() => answeredRounds.value.length);
  const pendingRoundCount = computed(() => input.rounds.value.length - answeredRoundCount.value);
  const canPublish = computed(() => answeredRoundCount.value > 0);
  const latestQuickAnswer = computed(() => {
    const participant = input.participants.value[0];
    if (!participant) return '';
    for (let index = input.rounds.value.length - 1; index >= 0; index -= 1) {
      const answer = input.rounds.value[index]?.answers[participant]?.text.trim() ?? '';
      if (answer) return answer;
    }
    return '';
  });
  const publishHelp = computed(() => {
    if (!canPublish.value) return '질문 하나와 답 하나를 목차에 실으면 발행할 수 있어요.';
    if (pendingRoundCount.value > 0) {
      return `지금 발행하면 답을 쓴 ${answeredRoundCount.value}개 질문만 실려요. 답 대기 중인 ${pendingRoundCount.value}개는 다음 호 초고로 남겨둬요.`;
    }
    return '지금 발행하면 이 호가 내 책장에 저장돼요.';
  });
  const quickDone = computed(
    () =>
      input.mode.value === 'quick' &&
      input.quickReady.value &&
      canPublish.value &&
      input.currentRound.value.question.trim() === '',
  );

  return {
    answeredRounds,
    defaultIssueTitle,
    issueTitle,
    answeredRoundCount,
    pendingRoundCount,
    canPublish,
    latestQuickAnswer,
    publishHelp,
    quickDone,
  };
}
