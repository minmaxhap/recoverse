import type { Reflection, ReflectionPeriod } from "../types/reflection";

export const REFLECTION_SHARE_SCHEMA = "recoverse_shared_reflection_v1";
export const REFLECTION_SHARE_HASH_PREFIX = "#share=";
export const REFLECTION_SHARE_MAX_ENCODED_LENGTH = 60000;

const REFLECTION_SHARE_MAX_JSON_BYTES = 45000;
const REFLECTION_SHARE_MAX_ITEMS = 50;
const SHARE_TITLE_MAX_LENGTH = 140;
const SHARE_LABEL_MAX_LENGTH = 120;
const SHARE_QUESTION_MAX_LENGTH = 400;
const SHARE_ANSWER_MAX_LENGTH = 2000;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;

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

function trimText(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength);
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

  if (snapshot.items.length === 0 || snapshot.items.length > REFLECTION_SHARE_MAX_ITEMS) {
    return null;
  }

  const items = snapshot.items
    .map((item) => ({
      groupLabel: trimText(item?.groupLabel, SHARE_LABEL_MAX_LENGTH),
      questionId: trimText(item?.questionId, SHARE_LABEL_MAX_LENGTH),
      questionText: trimText(item?.questionText, SHARE_QUESTION_MAX_LENGTH),
      answerText: trimText(item?.answerText, SHARE_ANSWER_MAX_LENGTH),
    }))
    .filter((item) => item.groupLabel && item.questionId && item.questionText && item.answerText);

  if (items.length === 0) return null;

  return {
    schema: REFLECTION_SHARE_SCHEMA,
    sharedAt:
      typeof snapshot.sharedAt === "string" ? snapshot.sharedAt : new Date().toISOString(),
    title: trimText(snapshot.title, SHARE_TITLE_MAX_LENGTH),
    period: {
      label: trimText(snapshot.period.label, SHARE_LABEL_MAX_LENGTH),
      year: Number.isFinite(Number(snapshot.period.year)) ? Number(snapshot.period.year) : undefined,
      startDate: typeof snapshot.period.startDate === "string" ? snapshot.period.startDate : undefined,
      endDate: typeof snapshot.period.endDate === "string" ? snapshot.period.endDate : undefined,
    },
    representativeSentence:
      typeof snapshot.representativeSentence === "string" &&
      snapshot.representativeSentence.trim()
        ? trimText(snapshot.representativeSentence, SHARE_ANSWER_MAX_LENGTH)
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

  const bytes = new TextEncoder().encode(JSON.stringify(normalized));
  if (bytes.byteLength > REFLECTION_SHARE_MAX_JSON_BYTES) {
    throw new Error("RECOVERSE_SHARE_TOO_LARGE");
  }

  return bytesToBase64Url(bytes);
}

export function decodeSharedReflectionSnapshot(encoded: string): SharedReflectionSnapshot | null {
  try {
    if (
      !encoded ||
      encoded.length > REFLECTION_SHARE_MAX_ENCODED_LENGTH ||
      !BASE64_URL_PATTERN.test(encoded)
    ) {
      return null;
    }

    const bytes = base64UrlToBytes(encoded);
    if (bytes.byteLength > REFLECTION_SHARE_MAX_JSON_BYTES) return null;

    const json = new TextDecoder().decode(bytes);
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
