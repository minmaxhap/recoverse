export type ReviewEntry = {
  id: string;
  year: number;      // 2016~2024
  q: string;         // question text
  a: string;         // answer text (짧은 문장)
  createdAt: string; // ISO
};

export type BackupPayload = {
  schema: "recoverse_v1";
  exportedAt: string;
  entries: ReviewEntry[];
};

const KEY = "recoverse_v1_entries";

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

export function loadEntries(): ReviewEntry[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  const parsed = safeParse<ReviewEntry[]>(raw);
  if (!parsed || !Array.isArray(parsed)) return [];

  return parsed
    .filter((x: any) =>
      x &&
      typeof x.id === "string" &&
      typeof x.year === "number" &&
      typeof x.q === "string" &&
      typeof x.a === "string" &&
      typeof x.createdAt === "string"
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveEntries(entries: ReviewEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function addEntry(input: { year: number; q: string; a: string }): ReviewEntry[] {
  const entry: ReviewEntry = {
    id: uuid(),
    year: Number(input.year),
    q: input.q.trim(),
    a: input.a.trim(),
    createdAt: new Date().toISOString(),
  };
  const current = loadEntries();
  const next = [entry, ...current];
  saveEntries(next);
  return next;
}

export function updateEntry(id: string, patch: { year: number; q: string; a: string }): ReviewEntry[] {
  const current = loadEntries();
  const next = current.map((x) =>
    x.id === id
      ? { ...x, year: Number(patch.year), q: patch.q.trim(), a: patch.a.trim() }
      : x
  );
  saveEntries(next);
  return loadEntries();
}

export function deleteEntry(id: string): ReviewEntry[] {
  const current = loadEntries();
  const next = current.filter((x) => x.id !== id);
  saveEntries(next);
  return next;
}

/** 같은 연도+같은 질문이 이미 있으면 찾아줌 (폰 입력 실수 방지용) */
export function findSameYearQuestion(
  entries: ReviewEntry[],
  year: number,
  q: string
): ReviewEntry | undefined {
  const qq = q.trim();
  return entries.find((x) => x.year === year && x.q === qq);
}

/** 질문은행(자동완성용): 지금까지 등장한 질문을 빈도/최근 기준으로 뽑기 */
export function getQuestionBank(
  entries: ReviewEntry[]
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
      if (a.count !== b.count) return b.count - a.count; // 자주 나온 질문 우선
      return a.lastAt < b.lastAt ? 1 : -1;               // 최근 사용 우선
    });
}

/** 질문별로 연도 답을 “비교용 타임라인”으로 묶기 */
export function buildQuestionTimeline(
  entries: ReviewEntry[],
  q: string
): { year: number; a: string; id: string }[] {
  const qq = q.trim();
  return entries
    .filter((e) => e.q === qq)
    .sort((a, b) => a.year - b.year)
    .map((e) => ({ year: e.year, a: e.a, id: e.id }));
}

/** 백업/복원 */
export function exportBackup(entries: ReviewEntry[]): Blob {
  const payload: BackupPayload = {
    schema: "recoverse_v1",
    exportedAt: new Date().toISOString(),
    entries,
  };
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export function importBackup(jsonText: string): ReviewEntry[] {
  const parsed = safeParse<any>(jsonText);
  if (!parsed) throw new Error("JSON 파싱 실패");

  const entries = Array.isArray(parsed) ? parsed : parsed.entries;
  if (!Array.isArray(entries)) throw new Error("entries 배열이 없습니다");

  const normalized: ReviewEntry[] = entries
    .filter((x) => x && typeof x === "object")
    .map((x: any) => ({
      id: typeof x.id === "string" ? x.id : uuid(),
      year: Number(x.year),
      q: String(x.q ?? x.question ?? ""),
      a: String(x.a ?? x.answer ?? ""),
      createdAt: typeof x.createdAt === "string" ? x.createdAt : new Date().toISOString(),
    }))
    .filter((e) => Number.isFinite(e.year) && e.q.trim().length > 0);

  // 중복 제거: id 기준(최신 createdAt 우선)
  const map = new Map<string, ReviewEntry>();
  for (const e of normalized) {
    const prev = map.get(e.id);
    if (!prev || prev.createdAt < e.createdAt) map.set(e.id, e);
  }

  const deduped = Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  saveEntries(deduped);
  return deduped;
}

/**
 * ✅ 연도 생성 버튼용:
 * targetYear에 (targetYear-1)의 질문 목록을 한 번에 복제한다.
 * - 답(a)은 빈칸
 * - targetYear에 이미 있는 질문은 건너뜀(중복 생성 방지)
 */
export function clonePrevYearQuestions(opts: {
  targetYear: number;
}): { added: number; skipped: number; entries: ReviewEntry[] } {
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

  const toAdd: ReviewEntry[] = [];
  for (const q of prevQuestions) {
    if (existingTarget.has(q)) {
      skipped++;
      continue;
    }
    toAdd.push({
      id: uuid(),
      year: targetYear,
      q,
      a: "", // 답은 빈칸
      createdAt: new Date().toISOString(),
    });
    added++;
  }

  const next = [...toAdd, ...current];
  saveEntries(next);

  return { added, skipped, entries: loadEntries() };
}
