/** 참여자 스탬프 팔레트 — 합류 순 (스펙 §7) */
export const PARTICIPANT_PALETTE = [
  '#D8451F',
  '#B98A2A',
  '#3D7A5C',
  '#4E6E93',
  '#7D5578',
  '#8C4B3A',
] as const;

/** 이름 → 색. players 배열의 합류 순 인덱스로 배정. */
export function colorFor(name: string, players: string[]): string {
  const idx = players.indexOf(name);
  return PARTICIPANT_PALETTE[Math.max(0, idx) % PARTICIPANT_PALETTE.length];
}

/** 인덱스로 직접 (복간·열람처럼 players가 곧 순서일 때) */
export function colorAt(index: number): string {
  return PARTICIPANT_PALETTE[Math.max(0, index) % PARTICIPANT_PALETTE.length];
}
