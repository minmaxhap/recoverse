import { defaultTitle, type Issue, type Kind, type Round, type SessionStateResponse } from '@recoverse/shared';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** 라이브 세션 종료 상태 → 책장 Issue */
export function issueFromSession(state: SessionStateResponse): Issue {
  const { meta, players } = state;
  return {
    id: uuid(),
    kind: meta.kind,
    date: meta.date,
    title: defaultTitle(meta.kind, meta.date),
    participants: players,
    rounds: meta.history,
    source: 'live',
  };
}

export interface EditorDraft {
  kind: Kind;
  date: string; // ISO
  title: string;
  participants: string[];
  rounds: Round[];
}

/**
 * 답이 하나라도 채워진 라운드인지. 질문 팩을 "답 대기" 상태로 목차에 미리 깔 수 있으므로,
 * 발행 대상과 아직 답을 기다리는 아젠다를 이 기준으로 가른다.
 */
export function roundIsAnswered(round: Round): boolean {
  return Object.values(round.answers).some((answer) => answer.text.trim().length > 0);
}

/** 혼자 쓰기 / 복간 에디터 → 책장 Issue. 답이 없는(대기 중) 라운드는 발행에서 제외한다. */
export function issueFromDraft(draft: EditorDraft, source: 'solo' | 'paper'): Issue {
  const title = draft.title.trim() || defaultTitle(draft.kind, draft.date);
  const issue: Issue = {
    id: uuid(),
    kind: draft.kind,
    date: draft.date,
    title,
    participants: draft.participants,
    rounds: draft.rounds.filter(roundIsAnswered),
    source,
  };
  return issue;
}
