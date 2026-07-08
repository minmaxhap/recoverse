/* 스펙 §3 데이터 모델 — 전 Phase 공용. 필드 추가/변경 금지 (옵셔널은 Phase 2·3용) */

export type Phase = 'lobby' | 'question' | 'answer' | 'guess' | 'ended';
export type Kind = 'yearend' | 'travel' | 'monthly' | 'project' | 'reading' | 'couple' | 'free';

export interface SessionMeta {
  code: string;            // 4자리, [A-HJ-NP-Z2-9]
  kind: Kind;              // 발행 시 칩 선택, 기본 yearend
  date: string;            // ISO 'YYYY-MM-DD' — 회고 기준일. 별도 year 필드 금지(표시용 연도는 파생)
  host: string;
  phase: Phase;
  roundIdx: number;        // -1 = lobby
  asker: string | null;
  question: string | null;
  format?: string | null;
  history: Round[];
}

export interface Round {
  asker: string;           // 질문자 이름. AI 추천 질문이어도 채택자가 asker
  question: string;
  format?: string;         // Phase 3: 포맷 ID (예: 'three-scenes'). 없으면 일반 문답
  answers: Record<string, Answer>;
}

export interface Answer {
  text: string;
  media?: string[];        // Phase 3: 사진 URL
  followUps?: { q: string; a: string }[]; // Phase 2: AI 생각 확장 문답
}

export interface Issue {
  id: string;
  kind: Kind;
  date: string;            // ISO
  title: string;           // 자유. 기본값 kind 기반: "2026 연말호", "제주 여행 특집호", "6월호"
  participants: string[];
  rounds: Round[];         // 스캔 호는 전사 전까지 빈 배열일 수 있음
  pages?: string[];        // Phase 2: 스캔 원본 이미지 URL (전사 후에도 원본 유지)
  source?: 'live' | 'solo' | 'paper' | 'scan' | 'import'; // 어떻게 만들어진 호인지
  shareId?: string;        // Phase 2: 읽기 전용 공유
}

export const KINDS: Kind[] = ['yearend', 'travel', 'monthly', 'project', 'reading', 'couple', 'free'];

export const KIND_LABELS: Record<Kind, string> = {
  yearend: '연말',
  travel: '여행',
  monthly: '월간',
  project: '프로젝트',
  reading: '독서',
  couple: '커플',
  free: '자유',
};

/** kind + date 기반 기본 제목: "2026 연말호", "2025 여행 특집호", "6월호" … */
export function defaultTitle(kind: Kind, date: string): string {
  const year = date.slice(0, 4);
  switch (kind) {
    case 'yearend': return `${year} 연말호`;
    case 'travel': return `${year} 여행 특집호`;
    case 'monthly': {
      const month = Number(date.slice(5, 7));
      return Number.isFinite(month) && month >= 1 ? `${year} ${month}월호` : `${year} 월간호`;
    }
    case 'project': return `${year} 프로젝트 특집호`;
    case 'reading': return `${year} 독서 특집호`;
    case 'couple': return `${year} 커플 특집호`;
    case 'free': return `${year} 자유호`;
  }
}
