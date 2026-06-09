import type {
  AppLanguage,
  BackupPayloadV2,
  Capsule,
  CapsuleBackup,
  CapsuleCard,
  CapsuleData,
  CapsuleImportResult,
  CapsuleType,
  ReviewEntryV2,
} from "../types/recoverse";
import { capsuleTemplates } from "./capsuleTemplates";

export type {
  AppLanguage,
  BackupPayloadV2,
  Capsule,
  CapsuleBackup,
  CapsuleCard,
  CapsuleData,
  CapsuleImportResult,
  CapsuleTemplate,
  CapsuleType,
  LocalizedCapsuleTemplate,
  ReviewEntryV2,
} from "../types/recoverse";
export { capsuleTemplates } from "./capsuleTemplates";

const KEY = "recoverse_v2_entries";
const LEGACY_KEY_V1 = "recoverse_v1_entries"; // 예전 키가 남아있을 수 있어 체크용
const CAPSULE_KEY = "recoverse_capsule_v1";

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

function stableId(prefix: string, value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return `${prefix}_${(hash >>> 0).toString(36)}`;
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

function normalizeCapsule(raw: any): Capsule | null {
  if (!raw || typeof raw !== "object") return null;

  const title = String(raw.title ?? "").trim();
  if (!title) return null;

  const now = new Date().toISOString();
  const allowedTypes: CapsuleType[] = [
    "year",
    "life_stage",
    "career",
    "relationship",
    "travel",
    "project",
    "custom",
  ];
  const type = allowedTypes.includes(raw.type) ? raw.type : "custom";

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    title,
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : undefined,
    type,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

function normalizeCapsuleCard(raw: any): CapsuleCard | null {
  if (!raw || typeof raw !== "object") return null;

  const capsuleId = String(raw.capsuleId ?? "").trim();
  const questionText = String(raw.questionText ?? raw.q ?? raw.question ?? "").trim();
  if (!capsuleId || !questionText) return null;

  const now = new Date().toISOString();
  const source =
    raw.source === "default" || raw.source === "user" || raw.source === "imported"
      ? raw.source
      : "user";

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    capsuleId,
    questionText,
    answers: normalizeAnswers(raw.answers ?? raw.a ?? raw.answer),
    source,
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

export function buildCapsuleDataFromEntries(entries: ReviewEntryV2[]): CapsuleData {
  const capsules = new Map<string, Capsule>();
  const cards: CapsuleCard[] = [];

  for (const entry of entries) {
    const capsuleId = stableId("capsule_year", String(entry.year));
    if (!capsules.has(capsuleId)) {
      capsules.set(capsuleId, {
        id: capsuleId,
        title: `${entry.year}년 회고`,
        type: "year",
        createdAt: entry.createdAt,
        updatedAt: entry.createdAt,
      });
    }

    cards.push({
      id: entry.id,
      capsuleId,
      questionText: entry.q,
      answers: [...entry.answers],
      source: "imported",
      order: cards.filter((card) => card.capsuleId === capsuleId).length,
      createdAt: entry.createdAt,
      updatedAt: entry.createdAt,
    });
  }

  return {
    capsules: Array.from(capsules.values()).sort((a, b) => a.title.localeCompare(b.title)),
    cards,
  };
}

export function loadCapsuleData(): CapsuleData {
  const raw = localStorage.getItem(CAPSULE_KEY);
  if (raw) {
    const parsed = safeParse<any>(raw);
    const capsules = Array.isArray(parsed?.capsules)
      ? (parsed.capsules.map(normalizeCapsule).filter(Boolean) as Capsule[])
      : [];
    const cards = Array.isArray(parsed?.cards)
      ? (parsed.cards.map(normalizeCapsuleCard).filter(Boolean) as CapsuleCard[])
      : [];

    if (parsed && typeof parsed === "object") return { capsules, cards };
  }

  return buildCapsuleDataFromEntries(loadEntries());
}

export function saveCapsuleData(data: CapsuleData) {
  const capsules = data.capsules.map(normalizeCapsule).filter(Boolean) as Capsule[];
  const capsuleIds = new Set(capsules.map((capsule) => capsule.id));
  const cards = (data.cards.map(normalizeCapsuleCard).filter(Boolean) as CapsuleCard[]).filter(
    (card) => capsuleIds.has(card.capsuleId)
  );

  localStorage.setItem(CAPSULE_KEY, JSON.stringify({ capsules, cards }));
}

export function createCapsule(input: {
  title: string;
  description?: string;
  type: CapsuleType;
  templateId?: string;
  language?: AppLanguage;
}): CapsuleData {
  const now = new Date().toISOString();
  const capsule: Capsule = {
    id: uuid(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    type: input.type,
    createdAt: now,
    updatedAt: now,
  };

  if (!capsule.title) throw new Error("Capsule title is required");

  const template = input.templateId
    ? capsuleTemplates.find((item) => item.id === input.templateId)
    : undefined;
  const language = input.language ?? "ko";

  const current = loadCapsuleData();
  const cards: CapsuleCard[] =
    template?.questions[language].map((questionText, index) => ({
      id: uuid(),
      capsuleId: capsule.id,
      questionText,
      answers: [],
      source: "default",
      order: index,
      createdAt: now,
      updatedAt: now,
    })) ?? [];

  const next = {
    capsules: [capsule, ...current.capsules],
    cards: [...cards, ...current.cards],
  };
  saveCapsuleData(next);
  return next;
}

export function exportCapsuleBackup(data: CapsuleData, capsuleId?: string): Blob {
  const capsules = capsuleId
    ? data.capsules.filter((capsule) => capsule.id === capsuleId)
    : data.capsules;
  const capsuleIds = new Set(capsules.map((capsule) => capsule.id));
  const cards = data.cards.filter((card) => capsuleIds.has(card.capsuleId));
  const payload: CapsuleBackup = {
    schema: "recoverse_capsule_v1",
    exportedAt: new Date().toISOString(),
    capsules,
    cards,
  };

  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
}

export function importCapsuleBackup(jsonText: string): CapsuleImportResult {
  const parsed = safeParse<any>(jsonText);
  if (!parsed) throw new Error("JSON parsing failed");

  let imported: CapsuleData;
  if (parsed?.schema === "recoverse_capsule_v1") {
    imported = {
      capsules: Array.isArray(parsed.capsules)
        ? (parsed.capsules.map(normalizeCapsule).filter(Boolean) as Capsule[])
        : [],
      cards: Array.isArray(parsed.cards)
        ? (parsed.cards.map(normalizeCapsuleCard).filter(Boolean) as CapsuleCard[])
        : [],
    };
  } else {
    const legacyEntries = Array.isArray(parsed) ? parsed : parsed?.entries;
    if (!Array.isArray(legacyEntries)) throw new Error("Unsupported backup format");

    imported = buildCapsuleDataFromEntries(
      legacyEntries.map(normalizeEntry).filter(Boolean) as ReviewEntryV2[]
    );
  }

  const current = loadCapsuleData();
  const capsuleIds = new Set(current.capsules.map((capsule) => capsule.id));
  const cardIds = new Set(current.cards.map((card) => card.id));

  const newCapsules = imported.capsules.filter((capsule) => !capsuleIds.has(capsule.id));
  const newCapsuleIds = new Set([...capsuleIds, ...newCapsules.map((capsule) => capsule.id)]);
  const newCards = imported.cards.filter(
    (card) => !cardIds.has(card.id) && newCapsuleIds.has(card.capsuleId)
  );

  const data = {
    capsules: [...newCapsules, ...current.capsules],
    cards: [...newCards, ...current.cards],
  };
  saveCapsuleData(data);

  return {
    data,
    addedCapsules: newCapsules.length,
    addedCards: newCards.length,
    skippedCapsules: imported.capsules.length - newCapsules.length,
    skippedCards: imported.cards.length - newCards.length,
  };
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
