import type { Answer, SessionMeta } from './model';

/** GET /api/session/:code/state 응답 — meta는 스펙 형태 그대로, 파생 값은 봉투에 */
export interface SessionStateResponse {
  meta: SessionMeta;
  players: string[];                        // 합류 순
  answered: string[];                       // 이번 라운드 제출자 이름만
  answers: Record<string, Answer> | null;   // 전원 제출 전 null — 서버에서 은닉 강제
  guessed: string[];                        // 이번 라운드 추측 제출자
  guesses: Record<string, Record<string, string>> | null; // 전원 추측 또는 강제 공개 전 null
  pastGuesses: Record<number, Record<string, Record<string, string>>>; // 지난 라운드 추측 (누적 점수용)
  allAnswered: boolean;
  allGuessed: boolean;
  revealed: boolean;                        // 호스트 강제 공개 플래그
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
