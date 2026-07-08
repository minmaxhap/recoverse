import { fnv1a32, normalizeQuestion } from '@recoverse/shared';
import type { Answer, Issue } from '@recoverse/shared';

export interface RediscoverEntry {
  date: string;
  year: string;
  issueTitle: string;
  question: string; // 이 호에서의 원본 표기
  participants: string[];
  answers: Record<string, Answer>;
}

export interface QuestionGroup {
  key: string;
  question: string; // 대표 표기 (가장 최근 호의 표기)
  years: string[]; // 오름차순 고유 연도
  entries: RediscoverEntry[]; // date 오름차순
}

/**
 * 다시 발견 — 정규화 질문으로 그룹핑.
 * rounds가 있는 호만 대상 (스캔 호 제외). 다년 질문 우선, 그다음 최근 연도 우선 정렬.
 */
export function groupByQuestion(issues: Issue[]): QuestionGroup[] {
  const map = new Map<string, RediscoverEntry[]>();

  for (const issue of issues) {
    const year = issue.date.slice(0, 4);
    for (const round of issue.rounds ?? []) {
      const key = normalizeQuestion(round.question);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push({
        date: issue.date,
        year,
        issueTitle: issue.title,
        question: round.question,
        participants: issue.participants,
        answers: round.answers,
      });
      map.set(key, list);
    }
  }

  const groups: QuestionGroup[] = [];
  for (const [key, entries] of map) {
    entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const years = [...new Set(entries.map((e) => e.year))].sort();
    groups.push({
      key,
      question: entries[entries.length - 1].question, // 가장 최근 호의 표기를 대표로
      years,
      entries,
    });
  }

  return groups.sort((a, b) => {
    if (b.years.length !== a.years.length) return b.years.length - a.years.length;
    const aLast = a.years[a.years.length - 1] ?? '';
    const bLast = b.years[b.years.length - 1] ?? '';
    return bLast < aLast ? -1 : bLast > aLast ? 1 : 0;
  });
}

/* ── 오늘의 재발견 (스펙 §1.7: 1년 전 오늘 / 랜덤 추억) ── */

export interface RediscoveryMoment {
  groupKey: string; // 이 질문의 그룹 키 (타임라인으로 이동용)
  question: string;
  date: string;
  year: string;
  yearsAgo: number;
  issueTitle: string;
  participants: string[];
  answers: Record<string, Answer>;
  anniversary: boolean; // 오늘 즈음(±3일)의 지난 기록이면 true
}

function localToday(now: Date): { md: string; year: number; seed: string } {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return { md: `${m}-${d}`, year: y, seed: `${y}-${m}-${d}` };
}

/** MM-DD 두 날짜의 연중 거리(일). 연말↔연초 래핑 고려 */
function mdDistance(a: string, b: string): number {
  const toDoy = (md: string) => {
    const [m, d] = md.split('-').map(Number);
    const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    return (cum[m - 1] ?? 0) + d;
  };
  const diff = Math.abs(toDoy(a) - toDoy(b));
  return Math.min(diff, 365 - diff);
}

/**
 * 오늘 열어볼 만한 재발견 한 조각을 고른다.
 * - 우선순위: 오늘(±3일) 즈음의 지난 해 기록(1년 전 오늘)
 * - 없으면 아무 과거 기록에서 랜덤 (날짜 시드로 하루 동안 고정)
 * rounds가 있는 호만 대상. 후보 없으면 null.
 */
export function pickRediscoveryMoment(issues: Issue[], now: Date = new Date()): RediscoveryMoment | null {
  const { md, year, seed } = localToday(now);

  interface Cand {
    issue: Issue;
    roundIdx: number;
    dist: number;
    past: boolean;
  }
  const all: Cand[] = [];
  for (const issue of issues) {
    const iYear = Number(issue.date.slice(0, 4));
    const iMd = issue.date.slice(5, 10);
    const rounds = issue.rounds ?? [];
    for (let r = 0; r < rounds.length; r++) {
      if (!rounds[r] || Object.keys(rounds[r].answers ?? {}).length === 0) continue;
      all.push({ issue, roundIdx: r, dist: mdDistance(md, iMd), past: iYear < year });
    }
  }
  if (all.length === 0) return null;

  const anniversary = all.filter((c) => c.past && c.dist <= 3);
  const pool = anniversary.length > 0 ? anniversary : all;
  // 날짜 시드로 하루 동안 고정된 선택 (매 렌더마다 바뀌지 않게)
  const idx = fnv1a32(seed) % pool.length;
  const pick = pool[idx];

  const round = pick.issue.rounds[pick.roundIdx];
  const iYear = pick.issue.date.slice(0, 4);
  return {
    groupKey: normalizeQuestion(round.question),
    question: round.question,
    date: pick.issue.date,
    year: iYear,
    yearsAgo: Math.max(0, year - Number(iYear)),
    issueTitle: pick.issue.title,
    participants: pick.issue.participants,
    answers: round.answers,
    anniversary: anniversary.length > 0,
  };
}
