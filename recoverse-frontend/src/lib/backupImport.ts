import type { Issue, Kind, Round } from '@recoverse/shared';
import { parseIssues } from './issueParsing';

/**
 * 이전 Recoverse 백업(recoverse_reflections_v1)을 새 Issue[]로 변환한다.
 * 옛 앱은 단일 사용자(solo)라 참여자 이름이 없으므로 "나"로 넣는다.
 * 새 형식(Issue[] 또는 { issues: [] })도 그대로 받아들인다.
 */

export class BackupImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupImportError';
  }
}

const SOLO_NAME = '나';

// 옛 type → 새 kind
const KIND_MAP: Record<string, Kind> = {
  year: 'yearend',
  half_year: 'monthly',
  travel: 'travel',
  life_chapter: 'free',
  project: 'project',
  relationship: 'couple',
  custom: 'free',
};

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `import-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface OldQuestion {
  id: string;
  text: string;
}
interface OldReflection {
  id?: string;
  title?: string;
  type?: string;
  period?: { year?: number; startDate?: string; label?: string };
  questionGroups?: { questions?: OldQuestion[] }[];
  answers?: { questionId: string; value?: string; skipped?: boolean }[];
}

function reflectionToIssue(r: OldReflection): Issue | null {
  const answerByQ = new Map<string, string>();
  for (const a of r.answers ?? []) {
    if (a.skipped) continue;
    const v = (a.value ?? '').trim();
    if (v) answerByQ.set(a.questionId, v);
  }

  const rounds: Round[] = [];
  for (const group of r.questionGroups ?? []) {
    for (const q of group.questions ?? []) {
      const text = answerByQ.get(q.id);
      const question = (q.text ?? '').trim();
      if (!text || !question) continue;
      rounds.push({ asker: SOLO_NAME, question, answers: { [SOLO_NAME]: { text } } });
    }
  }
  if (rounds.length === 0) return null;

  const year =
    r.period?.year ??
    (r.period?.startDate ? Number(r.period.startDate.slice(0, 4)) : NaN);
  const date = Number.isFinite(year) ? `${year}-01-01` : new Date().toISOString().slice(0, 10);
  const kind = KIND_MAP[r.type ?? ''] ?? 'free';

  return {
    id: uuid(),
    kind,
    date,
    title: (r.title ?? '').trim() || `${date.slice(0, 4)} 회고`,
    participants: [SOLO_NAME],
    rounds,
    source: 'import',
  };
}

export function parseReflectionBackup(text: string): Issue[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupImportError('JSON 파일을 읽을 수 없어요. 올바른 백업 파일인지 확인해주세요.');
  }

  // 새 형식: Issue[] 또는 { issues: [...] }
  if (Array.isArray(parsed)) {
    const issues = parseIssues(parsed);
    if (issues.length > 0) return issues;
  }
  if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.issues)) {
      const issues = parseIssues(obj.issues);
      if (issues.length > 0) return issues;
    }
    // 옛 형식: recoverse_reflections_v1
    if (Array.isArray(obj.reflections)) {
      const out: Issue[] = [];
      for (const r of obj.reflections as OldReflection[]) {
        const issue = reflectionToIssue(r);
        if (issue) out.push(issue);
      }
      if (out.length > 0) return out;
      throw new BackupImportError('가져올 수 있는 회고가 없어요.');
    }
  }

  throw new BackupImportError('알아볼 수 있는 백업 형식이 아니에요.');
}
