import type { Reflection } from "../types/reflection";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function localDateLabel(date: Date): string {
  return `${date.getFullYear()}년 ${pad(date.getMonth() + 1)}월 ${pad(date.getDate())}일`;
}

/**
 * A single-question reflection that lets a brand-new user produce a memory
 * in roughly 30 seconds without entering the full wizard.
 *
 * It is still a real Reflection (same schema, same storage path) — the
 * shortcut just lives in the entry surface, not the data layer.
 */
export function createQuickReflection(now: Date = new Date()): Reflection {
  const iso = now.toISOString();
  const id = `quick_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const groupId = `${id}_g`;
  const questionId = `${id}_q`;
  const dateLabel = localDateLabel(now);

  return {
    id,
    title: `${dateLabel}의 한 줄`,
    type: "custom",
    mode: "solo",
    period: { label: dateLabel, year: now.getFullYear() },
    templateId: "quick_one_line",
    questionSetMode: "light",
    questionGroups: [
      {
        id: groupId,
        label: "오늘의 한 줄",
        questions: [
          {
            id: questionId,
            groupId,
            text: "지금 마음에 남은 한 가지는?",
            hint: "단어 하나, 문장 한 줄로도 충분해요.",
            isRepeatable: false,
            visibility: "public",
          },
        ],
      },
    ],
    answers: [],
    representativeSentence: undefined,
    visibility: "private",
    isCompleted: false,
    completionRate: 0,
    createdAt: iso,
    updatedAt: iso,
  };
}
