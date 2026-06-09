import type { AppLanguage, Capsule, CapsuleCard, CapsuleData, CapsuleType } from "../types/recoverse";
import { capsuleTemplates } from "./capsuleTemplates";
import { loadCapsuleData, saveCapsuleData } from "./recoverseStore";

function uuid(): string {
  return (crypto as any)?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
