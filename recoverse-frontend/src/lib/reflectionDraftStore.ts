import { readLocalStorageValue, writeLocalStorageValue } from "./safeLocalStorage";
export const REFLECTION_DRAFT_STORAGE_KEY = "recoverse_reflection_drafts_v1";

export type ReflectionDraftEntry = {
  readonly reflectionId: string;
  readonly questionId: string;
  readonly value: string;
  readonly updatedAt: string;
};

type ReflectionDraftPayload = {
  readonly drafts: readonly ReflectionDraftEntry[];
};

export type ReflectionDraftSaveResult =
  | { readonly ok: true; readonly draft: ReflectionDraftEntry | null }
  | { readonly ok: false; readonly reason: "storage_unavailable" | "write_failed" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}


function safeParse(raw: string | null): unknown {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeDraft(raw: unknown): ReflectionDraftEntry | null {
  if (!isRecord(raw)) return null;

  const reflectionId = normalizeText(raw.reflectionId).trim();
  const questionId = normalizeText(raw.questionId).trim();
  const updatedAt = normalizeText(raw.updatedAt).trim();
  if (!reflectionId || !questionId || !updatedAt) return null;

  return {
    reflectionId,
    questionId,
    value: normalizeText(raw.value),
    updatedAt,
  };
}

function normalizePayload(raw: unknown): ReflectionDraftEntry[] {
  if (!isRecord(raw) || !Array.isArray(raw.drafts)) return [];
  return raw.drafts.map(normalizeDraft).filter((draft): draft is ReflectionDraftEntry => Boolean(draft));
}

function writeDrafts(drafts: readonly ReflectionDraftEntry[]): ReflectionDraftSaveResult {
  const payload: ReflectionDraftPayload = { drafts };
  const result = writeLocalStorageValue(REFLECTION_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  return result.ok ? { ok: true, draft: null } : result;
}

export function loadReflectionDrafts(): ReflectionDraftEntry[] {
  const result = readLocalStorageValue(REFLECTION_DRAFT_STORAGE_KEY);
  return result.ok ? normalizePayload(safeParse(result.value)) : [];
}

export function loadReflectionDraft(
  reflectionId: string,
  questionId: string
): ReflectionDraftEntry | null {
  return (
    loadReflectionDrafts().find(
      (draft) => draft.reflectionId === reflectionId && draft.questionId === questionId
    ) ?? null
  );
}

export function saveReflectionDraft(options: {
  readonly reflectionId: string;
  readonly questionId: string;
  readonly value: string;
}): ReflectionDraftSaveResult {
  const reflectionId = options.reflectionId.trim();
  const questionId = options.questionId.trim();
  if (!reflectionId || !questionId) {
    return { ok: false, reason: "write_failed" };
  }

  const draft: ReflectionDraftEntry = {
    reflectionId,
    questionId,
    value: options.value,
    updatedAt: new Date().toISOString(),
  };
  const drafts = [
    draft,
    ...loadReflectionDrafts().filter(
      (item) => item.reflectionId !== reflectionId || item.questionId !== questionId
    ),
  ];
  const result = writeDrafts(drafts);
  return result.ok ? { ok: true, draft } : result;
}

export function clearReflectionDraft(
  reflectionId: string,
  questionId: string
): ReflectionDraftSaveResult {
  const drafts = loadReflectionDrafts().filter(
    (draft) => draft.reflectionId !== reflectionId || draft.questionId !== questionId
  );
  const result = writeDrafts(drafts);
  return result.ok ? { ok: true, draft: null } : result;
}

export function clearReflectionDraftsForReflection(reflectionId: string): ReflectionDraftSaveResult {
  const drafts = loadReflectionDrafts().filter((draft) => draft.reflectionId !== reflectionId);
  const result = writeDrafts(drafts);
  return result.ok ? { ok: true, draft: null } : result;
}
