import type { Reflection, ReflectionPeriod } from "../types/reflection";

export const REFLECTION_SHARE_SCHEMA = "recoverse_shared_reflection_v1";
export const REFLECTION_SHARE_HASH_PREFIX = "#share=";

export type SharedReflectionItem = {
  groupLabel: string;
  questionId: string;
  questionText: string;
  answerText: string;
};

export type SharedReflectionSnapshot = {
  schema: typeof REFLECTION_SHARE_SCHEMA;
  sharedAt: string;
  title: string;
  period: ReflectionPeriod;
  representativeSentence?: string;
  items: SharedReflectionItem[];
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function normalizeShareSnapshot(raw: unknown): SharedReflectionSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const snapshot = raw as Partial<SharedReflectionSnapshot>;

  if (
    snapshot.schema !== REFLECTION_SHARE_SCHEMA ||
    typeof snapshot.title !== "string" ||
    !snapshot.period ||
    typeof snapshot.period !== "object" ||
    !Array.isArray(snapshot.items)
  ) {
    return null;
  }

  const items = snapshot.items
    .map((item) => ({
      groupLabel: String(item?.groupLabel ?? "").trim(),
      questionId: String(item?.questionId ?? "").trim(),
      questionText: String(item?.questionText ?? "").trim(),
      answerText: String(item?.answerText ?? "").trim(),
    }))
    .filter((item) => item.groupLabel && item.questionId && item.questionText && item.answerText);

  if (items.length === 0) return null;

  return {
    schema: REFLECTION_SHARE_SCHEMA,
    sharedAt:
      typeof snapshot.sharedAt === "string" ? snapshot.sharedAt : new Date().toISOString(),
    title: snapshot.title.trim(),
    period: {
      label: String(snapshot.period.label ?? "").trim(),
      year: Number.isFinite(Number(snapshot.period.year)) ? Number(snapshot.period.year) : undefined,
      startDate: typeof snapshot.period.startDate === "string" ? snapshot.period.startDate : undefined,
      endDate: typeof snapshot.period.endDate === "string" ? snapshot.period.endDate : undefined,
    },
    representativeSentence:
      typeof snapshot.representativeSentence === "string" &&
      snapshot.representativeSentence.trim()
        ? snapshot.representativeSentence.trim()
        : undefined,
    items,
  };
}

export function buildSharedReflectionSnapshot(
  reflection: Reflection,
  selectedQuestionIds: string[]
): SharedReflectionSnapshot {
  const selected = new Set(selectedQuestionIds);
  const answerByQuestionId = new Map(
    reflection.answers.map((answer) => [answer.questionId, answer.value.trim()])
  );
  const items = reflection.questionGroups.flatMap((group) =>
    group.questions.flatMap((question) => {
      if (question.visibility !== "public" || !selected.has(question.id)) return [];
      const answerText = answerByQuestionId.get(question.id) ?? "";
      if (!answerText) return [];

      return [
        {
          groupLabel: group.label,
          questionId: question.id,
          questionText: question.text,
          answerText,
        },
      ];
    })
  );

  return {
    schema: REFLECTION_SHARE_SCHEMA,
    sharedAt: new Date().toISOString(),
    title: reflection.title,
    period: reflection.period,
    representativeSentence: reflection.representativeSentence,
    items,
  };
}

export function encodeSharedReflectionSnapshot(snapshot: SharedReflectionSnapshot): string {
  const normalized = normalizeShareSnapshot(snapshot);
  if (!normalized) throw new Error("RECOVERSE_SHARE_EMPTY");

  const json = JSON.stringify(normalized);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function decodeSharedReflectionSnapshot(encoded: string): SharedReflectionSnapshot | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(encoded));
    return normalizeShareSnapshot(JSON.parse(json));
  } catch {
    return null;
  }
}

export function buildShareHash(snapshot: SharedReflectionSnapshot): string {
  return `${REFLECTION_SHARE_HASH_PREFIX}${encodeSharedReflectionSnapshot(snapshot)}`;
}

export function readShareHash(hash: string): SharedReflectionSnapshot | null {
  if (!hash.startsWith(REFLECTION_SHARE_HASH_PREFIX)) return null;
  return decodeSharedReflectionSnapshot(hash.slice(REFLECTION_SHARE_HASH_PREFIX.length));
}
