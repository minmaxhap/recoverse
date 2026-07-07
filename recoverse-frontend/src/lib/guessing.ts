import { shuffledAnswerOrder } from '@recoverse/shared';
import type { SessionStateResponse } from '@recoverse/shared';

export { shuffledAnswerOrder };

/** 한 라운드에서 guesser가 맞힌 개수 — guesses[owner] === owner 인 것 */
export function roundCorrect(guesses: Record<string, string>): number {
  let n = 0;
  for (const [owner, guessed] of Object.entries(guesses)) {
    if (owner === guessed) n++;
  }
  return n;
}

/** 이번 라운드 각 참여자의 적중 수 (전원 추측 완료/공개 시) */
export function roundScores(
  allGuesses: Record<string, Record<string, string>>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [guesser, g] of Object.entries(allGuesses)) {
    out[guesser] = roundCorrect(g);
  }
  return out;
}

/** 누적 점수 — pastGuesses + (선택) 현재 라운드 guesses */
export function totalScores(
  pastGuesses: Record<number, Record<string, Record<string, string>>>,
  current?: Record<string, Record<string, string>> | null,
): Record<string, number> {
  const totals: Record<string, number> = {};
  const add = (rounds: Record<string, Record<string, string>>) => {
    for (const [guesser, g] of Object.entries(rounds)) {
      totals[guesser] = (totals[guesser] ?? 0) + roundCorrect(g);
    }
  };
  for (const rounds of Object.values(pastGuesses)) add(rounds);
  if (current) add(current);
  return totals;
}

/** 올해의 독심술사 — 누적 1위 (동점 공동). 점수 0뿐이면 빈 배열 */
export function mindReaders(totals: Record<string, number>): { names: string[]; score: number } {
  let max = 0;
  for (const s of Object.values(totals)) max = Math.max(max, s);
  if (max <= 0) return { names: [], score: 0 };
  const names = Object.entries(totals)
    .filter(([, s]) => s === max)
    .map(([n]) => n)
    .sort();
  return { names, score: max };
}

/** 상태에서 현재 라운드가 3인 이상 추측 게임을 하는지 */
export function isGuessSession(state: SessionStateResponse): boolean {
  return state.players.length >= 3;
}
