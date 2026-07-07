import type { Reflection } from "../types/reflection";
import { normalizeReflection } from "./reflectionStore";

export const REFLECTION_BACKUP_SCHEMA = "recoverse_reflections_v1";

export type ReflectionBackupPayload = {
  schema: typeof REFLECTION_BACKUP_SCHEMA;
  exportedAt: string;
  reflections: Reflection[];
};

export type ReflectionImportResult = {
  reflections: Reflection[];
  added: number;
  updated: number;
  skipped: number;
};

const MAX_BACKUP_TEXT_LENGTH = 4 * 1024 * 1024;
const MAX_BACKUP_REFLECTIONS = 500;
const MAX_BACKUP_QUESTION_GROUPS = 80;
const MAX_BACKUP_QUESTIONS = 1200;
const MAX_BACKUP_ANSWERS = 1200;
const MAX_BACKUP_TEXT_FIELD_LENGTH = 20000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function safeParse(raw: string): unknown {
  if (raw.length > MAX_BACKUP_TEXT_LENGTH) {
    throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("RECOVERSE_REFLECTION_IMPORT_INVALID_JSON");
  }
}

function hasOversizedText(value: unknown): boolean {
  return typeof value === "string" && value.length > MAX_BACKUP_TEXT_FIELD_LENGTH;
}

function assertReflectionWithinImportLimits(raw: unknown): void {
  if (!isRecord(raw)) return;

  if (hasOversizedText(raw.id) || hasOversizedText(raw.title) || hasOversizedText(raw.representativeSentence)) {
    throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
  }

  if (isRecord(raw.period)) {
    for (const value of Object.values(raw.period)) {
      if (hasOversizedText(value)) throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
    }
  }

  const questionGroups = Array.isArray(raw.questionGroups) ? raw.questionGroups : [];
  const answers = Array.isArray(raw.answers) ? raw.answers : [];
  if (
    questionGroups.length > MAX_BACKUP_QUESTION_GROUPS ||
    answers.length > MAX_BACKUP_ANSWERS
  ) {
    throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
  }

  let questionCount = 0;
  for (const group of questionGroups) {
    if (!isRecord(group)) continue;
    if (hasOversizedText(group.id) || hasOversizedText(group.label)) {
      throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
    }

    const questions = Array.isArray(group.questions) ? group.questions : [];
    questionCount += questions.length;
    if (questionCount > MAX_BACKUP_QUESTIONS) {
      throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
    }

    for (const question of questions) {
      if (!isRecord(question)) continue;
      if (
        hasOversizedText(question.id) ||
        hasOversizedText(question.groupId) ||
        hasOversizedText(question.text) ||
        hasOversizedText(question.hint)
      ) {
        throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
      }
    }
  }

  for (const answer of answers) {
    if (!isRecord(answer)) continue;
    if (
      hasOversizedText(answer.questionId) ||
      hasOversizedText(answer.value) ||
      hasOversizedText(answer.updatedAt)
    ) {
      throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
    }
  }
}

function normalizeBackupPayload(raw: unknown): Reflection[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("RECOVERSE_REFLECTION_IMPORT_INVALID_PAYLOAD");
  }

  const payload = raw as Partial<ReflectionBackupPayload>;
  if (payload.schema !== REFLECTION_BACKUP_SCHEMA || !Array.isArray(payload.reflections)) {
    throw new Error("RECOVERSE_REFLECTION_IMPORT_UNSUPPORTED_VERSION");
  }

  if (payload.reflections.length > MAX_BACKUP_REFLECTIONS) {
    throw new Error("RECOVERSE_REFLECTION_IMPORT_TOO_LARGE");
  }

  payload.reflections.forEach(assertReflectionWithinImportLimits);

  return payload.reflections
    .map((reflection) => normalizeReflection(reflection))
    .filter(Boolean) as Reflection[];
}

function timestampMs(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function exportReflectionBackup(reflections: Reflection[]): Blob {
  const normalized = reflections
    .map((reflection) => normalizeReflection(reflection))
    .filter(Boolean) as Reflection[];

  const payload: ReflectionBackupPayload = {
    schema: REFLECTION_BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    reflections: normalized,
  };

  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
}

export function parseReflectionBackup(text: string): Reflection[] {
  return normalizeBackupPayload(safeParse(text));
}

export function mergeReflectionBackup(
  currentReflections: Reflection[],
  backupText: string
): ReflectionImportResult {
  const incoming = parseReflectionBackup(backupText);
  const byId = new Map<string, Reflection>();

  for (const reflection of currentReflections) {
    const normalized = normalizeReflection(reflection);
    if (normalized) byId.set(normalized.id, normalized);
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const reflection of incoming) {
    const existing = byId.get(reflection.id);
    if (!existing) {
      byId.set(reflection.id, reflection);
      added += 1;
      continue;
    }

    if (timestampMs(reflection.updatedAt) > timestampMs(existing.updatedAt)) {
      byId.set(reflection.id, reflection);
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  const reflections = Array.from(byId.values()).sort(
    (a, b) => timestampMs(b.updatedAt) - timestampMs(a.updatedAt)
  );

  return { reflections, added, updated, skipped };
}
