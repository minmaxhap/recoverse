import { normalizeQuestion } from '@recoverse/shared';
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
