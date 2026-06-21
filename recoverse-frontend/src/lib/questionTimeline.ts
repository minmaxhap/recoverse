import type { Answer, Question, QuestionTimelineItem, Reflection } from "../types/reflection";

function normalizeQuestionText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function periodSortValue(item: QuestionTimelineItem): number {
  if (typeof item.period.year === "number") return item.period.year;
  if (item.period.startDate) return Date.parse(item.period.startDate);
  return 0;
}

function findQuestion(reflection: Reflection, questionId: string): Question | null {
  return (
    reflection.questionGroups
      .flatMap((group) => group.questions)
      .find((question) => question.id === questionId) ?? null
  );
}

function shouldIncludeAnswer(
  answer: Answer,
  question: Question | null,
  targetQuestionText: string,
  targetQuestionId?: string
): question is Question {
  if (!question || answer.skipped || !answer.value.trim()) return false;

  if (targetQuestionId && question.isRepeatable && question.id === targetQuestionId) {
    return true;
  }

  return normalizeQuestionText(question.text) === normalizeQuestionText(targetQuestionText);
}

export function findSameQuestionAnswers(
  targetQuestionText: string,
  reflections: Reflection[],
  targetQuestionId?: string
): QuestionTimelineItem[] {
  return reflections
    .flatMap((reflection) =>
      reflection.answers.flatMap((answer) => {
        const question = findQuestion(reflection, answer.questionId);
        if (!shouldIncludeAnswer(answer, question, targetQuestionText, targetQuestionId)) {
          return [];
        }

        return [
          {
            reflectionId: reflection.id,
            reflectionTitle: reflection.title,
            period: reflection.period,
            questionId: question.id,
            questionText: question.text,
            answer,
          },
        ];
      })
    )
    .sort((a, b) => periodSortValue(a) - periodSortValue(b));
}

export function getTimelineQuestionOptions(reflections: Reflection[]): Question[] {
  const seen = new Set<string>();
  const questions: Question[] = [];

  for (const reflection of reflections) {
    for (const question of reflection.questionGroups.flatMap((group) => group.questions)) {
      const key = question.isRepeatable
        ? `id:${question.id}`
        : `text:${normalizeQuestionText(question.text)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      questions.push(question);
    }
  }

  return questions.sort((a, b) => a.text.localeCompare(b.text));
}
