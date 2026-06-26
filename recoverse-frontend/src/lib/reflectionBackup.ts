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

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("RECOVERSE_REFLECTION_IMPORT_INVALID_JSON");
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

  return payload.reflections
    .map((reflection) => normalizeReflection(reflection))
    .filter(Boolean) as Reflection[];
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

    if (reflection.updatedAt > existing.updatedAt) {
      byId.set(reflection.id, reflection);
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  const reflections = Array.from(byId.values()).sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : -1
  );

  return { reflections, added, updated, skipped };
}
