import type { Reflection } from "../types/reflection";

export function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
}

export function getPreviewSentence(reflection: Reflection, limit = 88): string {
  const raw =
    reflection.representativeSentence?.trim() ||
    reflection.answers.find((answer) => answer.value.trim())?.value.trim() ||
    "";
  if (!raw) return "아직 첫 문장이 비어 있어요.";

  const firstLine = raw.split("\n")[0].trim() || raw.trim();
  return truncate(firstLine, limit);
}
