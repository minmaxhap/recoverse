import type {
  Capsule,
  CapsuleCard,
  CapsuleData,
  CapsuleType,
  ReviewEntryV2,
} from "../types/recoverse";
import type {
  Galaxy,
  GalaxyData,
  GalaxyLog,
  GalaxyMember,
  GalaxyPrompt,
  GalaxyTheme,
  ObservationData,
  ObservationRecordSnapshot,
  ObservationSnapshot,
} from "../types/recoverseFuture";

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
export type {
  Galaxy,
  GalaxyData,
  GalaxyLog,
  GalaxyMember,
  GalaxyPrompt,
  GalaxyTheme,
  ObservationData,
  ObservationRecordSnapshot,
  ObservationSnapshot,
} from "../types/recoverseFuture";

const KEY = "recoverse_v2_entries";
const LEGACY_KEY_V1 = "recoverse_v1_entries"; // 예전 키가 남아있을 수 있어 체크용
const CAPSULE_KEY = "recoverse_capsule_v1";
const GALAXY_KEY = "recoverse_galaxy_v1";
const OBSERVATION_KEY = "recoverse_observation_v1";

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

const allowedGalaxyThemes: GalaxyTheme[] = [
  "year",
  "trip",
  "project",
  "relationship",
  "career",
  "custom",
];

function normalizeGalaxy(raw: any): Galaxy | null {
  if (!raw || typeof raw !== "object") return null;

  const title = String(raw.title ?? "").trim();
  if (!title) return null;

  const now = new Date().toISOString();
  const theme = allowedGalaxyThemes.includes(raw.theme) ? raw.theme : "custom";

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    title,
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : undefined,
    theme,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

function normalizeGalaxyMember(raw: any): GalaxyMember | null {
  if (!raw || typeof raw !== "object") return null;

  const galaxyId = String(raw.galaxyId ?? "").trim();
  const displayName = String(raw.displayName ?? "").trim();
  if (!galaxyId || !displayName) return null;

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    galaxyId,
    displayName,
    colorTone: typeof raw.colorTone === "string" ? raw.colorTone : undefined,
    joinedAt: typeof raw.joinedAt === "string" ? raw.joinedAt : new Date().toISOString(),
  };
}

function normalizeGalaxyPrompt(raw: any): GalaxyPrompt | null {
  if (!raw || typeof raw !== "object") return null;

  const galaxyId = String(raw.galaxyId ?? "").trim();
  const questionText = String(raw.questionText ?? raw.q ?? raw.question ?? "").trim();
  if (!galaxyId || !questionText) return null;

  const now = new Date().toISOString();

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    galaxyId,
    questionText,
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

function normalizeGalaxyLog(raw: any): GalaxyLog | null {
  if (!raw || typeof raw !== "object") return null;

  const galaxyId = String(raw.galaxyId ?? "").trim();
  const promptId = String(raw.promptId ?? "").trim();
  const memberId = String(raw.memberId ?? "").trim();
  if (!galaxyId || !promptId || !memberId) return null;

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    galaxyId,
    promptId,
    memberId,
    answers: normalizeAnswers(raw.answers ?? raw.a ?? raw.answer),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

function normalizeObservationRecordSnapshot(raw: any): ObservationRecordSnapshot | null {
  if (!raw || typeof raw !== "object") return null;

  const title = String(raw.title ?? "").trim();
  if (!title) return null;

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    title,
    logs: normalizeAnswers(raw.logs ?? raw.answers),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : 0,
  };
}

function normalizeObservationSnapshot(raw: any): ObservationSnapshot | null {
  if (!raw || typeof raw !== "object") return null;

  const sourceType = raw.sourceType === "galaxy" ? "galaxy" : raw.sourceType === "planet" ? "planet" : null;
  const sourceId = String(raw.sourceId ?? "").trim();
  const title = String(raw.title ?? "").trim();
  if (!sourceType || !sourceId || !title) return null;

  const now = new Date().toISOString();

  return {
    id: typeof raw.id === "string" ? raw.id : uuid(),
    sourceType,
    sourceId,
    title,
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description.trim()
        : undefined,
    accessMode: "read_only",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    publishedAt: typeof raw.publishedAt === "string" ? raw.publishedAt : undefined,
    records: Array.isArray(raw.records)
      ? (raw.records
          .map(normalizeObservationRecordSnapshot)
          .filter(Boolean) as ObservationRecordSnapshot[])
      : [],
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

export function loadGalaxyData(): GalaxyData {
  const raw = localStorage.getItem(GALAXY_KEY);
  if (!raw) return { galaxies: [], members: [], prompts: [], logs: [] };

  const parsed = safeParse<any>(raw);
  const galaxies = Array.isArray(parsed?.galaxies)
    ? (parsed.galaxies.map(normalizeGalaxy).filter(Boolean) as Galaxy[])
    : [];
  const galaxyIds = new Set(galaxies.map((galaxy) => galaxy.id));
  const members = Array.isArray(parsed?.members)
    ? (parsed.members.map(normalizeGalaxyMember).filter(Boolean) as GalaxyMember[]).filter(
        (member) => galaxyIds.has(member.galaxyId)
      )
    : [];
  const prompts = Array.isArray(parsed?.prompts)
    ? (parsed.prompts.map(normalizeGalaxyPrompt).filter(Boolean) as GalaxyPrompt[]).filter(
        (prompt) => galaxyIds.has(prompt.galaxyId)
      )
    : [];
  const promptIds = new Set(prompts.map((prompt) => prompt.id));
  const memberIds = new Set(members.map((member) => member.id));
  const logs = Array.isArray(parsed?.logs)
    ? (parsed.logs.map(normalizeGalaxyLog).filter(Boolean) as GalaxyLog[]).filter(
        (log) =>
          galaxyIds.has(log.galaxyId) && promptIds.has(log.promptId) && memberIds.has(log.memberId)
      )
    : [];

  return { galaxies, members, prompts, logs };
}

export function saveGalaxyData(data: GalaxyData) {
  const galaxies = data.galaxies.map(normalizeGalaxy).filter(Boolean) as Galaxy[];
  const galaxyIds = new Set(galaxies.map((galaxy) => galaxy.id));
  const members = (data.members.map(normalizeGalaxyMember).filter(Boolean) as GalaxyMember[]).filter(
    (member) => galaxyIds.has(member.galaxyId)
  );
  const prompts = (data.prompts.map(normalizeGalaxyPrompt).filter(Boolean) as GalaxyPrompt[]).filter(
    (prompt) => galaxyIds.has(prompt.galaxyId)
  );
  const promptIds = new Set(prompts.map((prompt) => prompt.id));
  const memberIds = new Set(members.map((member) => member.id));
  const logs = (data.logs.map(normalizeGalaxyLog).filter(Boolean) as GalaxyLog[]).filter(
    (log) =>
      galaxyIds.has(log.galaxyId) && promptIds.has(log.promptId) && memberIds.has(log.memberId)
  );

  localStorage.setItem(GALAXY_KEY, JSON.stringify({ galaxies, members, prompts, logs }));
}

export function loadObservationData(): ObservationData {
  const raw = localStorage.getItem(OBSERVATION_KEY);
  if (!raw) return { snapshots: [] };

  const parsed = safeParse<any>(raw);
  const snapshots = Array.isArray(parsed?.snapshots)
    ? (parsed.snapshots.map(normalizeObservationSnapshot).filter(Boolean) as ObservationSnapshot[])
    : [];

  return { snapshots };
}

export function saveObservationData(data: ObservationData) {
  const snapshots = data.snapshots
    .map(normalizeObservationSnapshot)
    .filter(Boolean) as ObservationSnapshot[];

  localStorage.setItem(OBSERVATION_KEY, JSON.stringify({ snapshots }));
}
