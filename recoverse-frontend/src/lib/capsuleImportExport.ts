import type {
  Capsule,
  CapsuleBackup,
  CapsuleCard,
  CapsuleData,
  CapsuleImportPreview,
  CapsuleImportResult,
  CapsuleType,
  ReviewEntryV2,
} from "../types/recoverse";
import { buildCapsuleDataFromEntries, loadCapsuleData, saveCapsuleData } from "./recoverseStore";

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
  const answers = normalizeAnswers(anyObj.answers ?? anyObj.a ?? anyObj.answer);
  const createdAt =
    typeof anyObj.createdAt === "string" ? anyObj.createdAt : new Date().toISOString();

  if (!Number.isFinite(year) || q.length === 0) return null;
  return { id, year, q, answers, createdAt };
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

function readCapsuleBackup(jsonText: string): CapsuleData {
  const parsed = safeParse<any>(jsonText);
  if (!parsed) throw new Error("JSON parsing failed");

  if (parsed?.schema === "recoverse_capsule_v1") {
    return {
      capsules: Array.isArray(parsed.capsules)
        ? (parsed.capsules.map(normalizeCapsule).filter(Boolean) as Capsule[])
        : [],
      cards: Array.isArray(parsed.cards)
        ? (parsed.cards.map(normalizeCapsuleCard).filter(Boolean) as CapsuleCard[])
        : [],
    };
  }

  const legacyEntries = Array.isArray(parsed) ? parsed : parsed?.entries;
  if (!Array.isArray(legacyEntries)) throw new Error("Unsupported backup format");

  return buildCapsuleDataFromEntries(
    legacyEntries.map(normalizeEntry).filter(Boolean) as ReviewEntryV2[]
  );
}

function buildImportResult(imported: CapsuleData, current: CapsuleData): CapsuleImportResult {
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

  return {
    data,
    addedCapsules: newCapsules.length,
    addedCards: newCards.length,
    skippedCapsules: imported.capsules.length - newCapsules.length,
    skippedCards: imported.cards.length - newCards.length,
  };
}

export function previewCapsuleBackupImport(jsonText: string): CapsuleImportPreview {
  const imported = readCapsuleBackup(jsonText);
  const result = buildImportResult(imported, loadCapsuleData());
  return {
    addedCapsules: result.addedCapsules,
    addedCards: result.addedCards,
    skippedCapsules: result.skippedCapsules,
    skippedCards: result.skippedCards,
  };
}

export function importCapsuleBackup(jsonText: string): CapsuleImportResult {
  const imported = readCapsuleBackup(jsonText);
  const result = buildImportResult(imported, loadCapsuleData());
  saveCapsuleData(result.data);
  return result;
}
