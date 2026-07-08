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

/** 혼자 쓰기 / 복간 에디터 → 책장 Issue */
export function issueFromDraft(draft: EditorDraft, source: 'solo' | 'paper'): Issue {
  const title = draft.title.trim() || defaultTitle(draft.kind, draft.date);
  const issue: Issue = {
    id: uuid(),
    kind: draft.kind,
    date: draft.date,
    title,
    participants: draft.participants,
    rounds: draft.rounds,
    source,
  };
  return issue;
}
