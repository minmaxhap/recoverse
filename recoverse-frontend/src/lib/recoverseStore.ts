export type ReviewEntryV2 = {
  id: string;
  year: number;
  q: string;
  answers: string[]; // ✅ 핵심: 답 여러 개
  createdAt: string; // ISO
};

export type BackupPayloadV2 = {
  schema: "recoverse_v2";
  exportedAt: string;
  entries: ReviewEntryV2[];
};

const KEY = "recoverse_v2_entries";
const LEGACY_KEY_V1 = "recoverse_v1_entries"; // 예전 키가 남아있을 수 있어 체크용

function safeParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function uuid(): string {
  return (crypto as any)?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeAnswers(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x ?? "").trim()).filter((x) => x.length > 0);
  }
  if (typeof raw === "string") {
    // legacy "a" 문자열이 들어온 경우
    return raw
      .split("\n")
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }
  return [];
}

function normalizeEntry(anyObj: any): ReviewEntryV2 | null {
  if (!anyObj || typeof anyObj !== "object") return null;

  const id = typeof anyObj.id === "string" ? anyObj.id : uuid();
  const year = Number(anyObj.year);
  const q = String(anyObj.q ?? anyObj.question ?? "").trim();

  // ✅ v2는 answers[], v1은 a(string)
  const answers = normalizeAnswers(anyObj.answers ?? anyObj.a ?? anyObj.answer);

  const createdAt =
    typeof anyObj.createdAt === "string" ? anyObj.createdAt : new Date().toISOString();

  if (!Number.isFinite(year) || q.length === 0) return null;

  return { id, year, q, answers, createdAt };
}

function sortNewestFirst(a: ReviewEntryV2, b: ReviewEntryV2) {
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function loadEntries(): ReviewEntryV2[] {
  // 1) v2 우선 로드
  const rawV2 = localStorage.getItem(KEY);
  if (rawV2) {
    const parsed = safeParse<any>(rawV2);
    const entries = Array.isArray(parsed) ? parsed : parsed?.entries;
    if (Array.isArray(entries)) {
      const normalized = entries.map(normalizeEntry).filter(Boolean) as ReviewEntryV2[];
      return normalized.sort(sortNewestFirst);
    }
  }

  // 2) v1 키가 남아있다면 자동 마이그레이션
  const rawV1 = localStorage.getItem(LEGACY_KEY_V1);
  if (rawV1) {
    const parsed = safeParse<any>(rawV1);
    const entries = Array.isArray(parsed) ? parsed : parsed?.entries;
    if (Array.isArray(entries)) {
      const normalized = entries.map(normalizeEntry).filter(Boolean) as ReviewEntryV2[];
      saveEntries(normalized); // ✅ v2로 저장
      return normalized.sort(sortNewestFirst);
    }
  }

  return [];
}

export function saveEntries(entries: ReviewEntryV2[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function addEntry(input: { year: number; q: string; answers: string[] }): ReviewEntryV2[] {
  const entry: ReviewEntryV2 = {
    id: uuid(),
    year: Number(input.year),
    q: input.q.trim(),
    answers: normalizeAnswers(input.answers),
    createdAt: new Date().toISOString(),
  };

  const current = loadEntries();
  const next = [entry, ...current];
  saveEntries(next);
  return next;
}

export function updateEntry(
  id: string,
  patch: { year: number; q: string; answers: string[] }
): ReviewEntryV2[] {
  const current = loadEntries();
  const next = current.map((x) =>
    x.id === id
      ? {
          ...x,
          year: Number(patch.year),
          q: patch.q.trim(),
          answers: normalizeAnswers(patch.answers),
        }
      : x
  );
  saveEntries(next);
  return loadEntries();
}

export function deleteEntry(id: string): ReviewEntryV2[] {
  const current = loadEntries();
  const next = current.filter((x) => x.id !== id);
  saveEntries(next);
  return next;
}

/** 같은 연도+같은 질문이 이미 있으면 찾아줌 (중복 생성/입력 방지용) */
export function findSameYearQuestion(
  entries: ReviewEntryV2[],
  year: number,
  q: string
): ReviewEntryV2 | undefined {
  const qq = q.trim();
  return entries.find((x) => x.year === year && x.q === qq);
}

/** 질문은행(자동완성/선택용): 빈도/최근 기준 */
export function getQuestionBank(
  entries: ReviewEntryV2[]
): { q: string; count: number; lastAt: string }[] {
  const map = new Map<string, { count: number; lastAt: string }>();

  for (const e of entries) {
    const prev = map.get(e.q);
    if (!prev) map.set(e.q, { count: 1, lastAt: e.createdAt });
    else {
      prev.count += 1;
      if (prev.lastAt < e.createdAt) prev.lastAt = e.createdAt;
    }
  }

  return Array.from(map.entries())
    .map(([q, v]) => ({ q, count: v.count, lastAt: v.lastAt }))
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.lastAt < b.lastAt ? 1 : -1;
    });
}

/** 질문별 연도 답 비교 타임라인 */
export function buildQuestionTimeline(
  entries: ReviewEntryV2[],
  q: string
): { year: number; answers: string[]; id: string }[] {
  const qq = q.trim();
  return entries
    .filter((e) => e.q === qq)
    .sort((a, b) => a.year - b.year)
    .map((e) => ({ year: e.year, answers: e.answers, id: e.id }));
}

/** 백업/복원 (v2) */
export function exportBackup(entries: ReviewEntryV2[]): Blob {
  const payload: BackupPayloadV2 = {
    schema: "recoverse_v2",
    exportedAt: new Date().toISOString(),
    entries,
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export function importBackup(jsonText: string): ReviewEntryV2[] {
  const parsed = safeParse<any>(jsonText);
  if (!parsed) throw new Error("JSON 파싱 실패");

  const entries = Array.isArray(parsed) ? parsed : parsed?.entries;
  if (!Array.isArray(entries)) throw new Error("entries 배열이 없습니다");

  const normalized = entries.map(normalizeEntry).filter(Boolean) as ReviewEntryV2[];

  // id 중복 제거(최신 createdAt 우선)
  const map = new Map<string, ReviewEntryV2>();
  for (const e of normalized) {
    const prev = map.get(e.id);
    if (!prev || prev.createdAt < e.createdAt) map.set(e.id, e);
  }

  const deduped = Array.from(map.values()).sort(sortNewestFirst);
  saveEntries(deduped);
  return deduped;
}

/**
 * ✅ 연도 생성: (targetYear-1)의 질문을 targetYear로 복제
 * - answers는 빈 배열([])
 * - 이미 targetYear에 존재하는 질문은 건너뜀
 */
export function clonePrevYearQuestions(opts: {
  targetYear: number;
}): { added: number; skipped: number; entries: ReviewEntryV2[] } {
  const targetYear = Number(opts.targetYear);
  const prevYear = targetYear - 1;

  const current = loadEntries();

  const prevQuestions = Array.from(
    new Set(
      current
        .filter((e) => e.year === prevYear)
        .map((e) => e.q.trim())
        .filter(Boolean)
    )
  );

  const existingTarget = new Set(
    current.filter((e) => e.year === targetYear).map((e) => e.q.trim())
  );

  let added = 0;
  let skipped = 0;

  const toAdd: ReviewEntryV2[] = [];
  for (const q of prevQuestions) {
    if (existingTarget.has(q)) {
      skipped++;
      continue;
    }
    toAdd.push({
      id: uuid(),
      year: targetYear,
      q,
      answers: [], // ✅ 답은 빈칸(리스트)
      createdAt: new Date().toISOString(),
    });
    added++;
  }

  const next = [...toAdd, ...current];
  saveEntries(next);

  return { added, skipped, entries: loadEntries() };
}
