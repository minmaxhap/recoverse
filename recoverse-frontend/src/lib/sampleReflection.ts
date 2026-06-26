import { buildQuestionGroupsForMode, getReflectionTemplate } from "../data/reflectionTemplates";
import type { Answer, Reflection } from "../types/reflection";
import { calculateCompletionRate } from "./reflectionStore";

export const SAMPLE_REFLECTION_ID = "sample_reflection_jeju_trip";

const sampleAnswers: Record<string, string> = {
  travel_first_scene: "바다 앞 작은 식당에서 뜨거운 라면을 먹던 순간",
  travel_sense: "짠 바람 냄새, 귤 향, 숙소로 돌아가던 길의 조용한 음악",
  travel_unexpected: "계획한 곳보다 우연히 들어간 골목이 더 오래 기억에 남았어요.",
  travel_main_emotion: "편안함과 조금의 해방감",
  travel_after_feeling: "내가 생각보다 느린 시간을 좋아한다는 걸 알게 됐어요.",
  travel_people: "말없이 풍경을 같이 보던 친구 얼굴",
  travel_meaning: "쉬는 법을 다시 배운 여행",
};

export function createSampleReflection(): Reflection {
  const template = getReflectionTemplate("template_travel");
  if (!template) throw new Error("Missing travel reflection template");

  const questionGroups = buildQuestionGroupsForMode(template, "light");
  const now = new Date().toISOString();
  const answers: Answer[] = questionGroups.flatMap((group) =>
    group.questions.flatMap((question) => {
      const value = sampleAnswers[question.id]?.trim();
      if (!value) return [];

      return [
        {
          questionId: question.id,
          value,
          skipped: false,
          updatedAt: now,
        },
      ];
    })
  );

  return {
    id: SAMPLE_REFLECTION_ID,
    title: "제주 여행의 기억",
    type: "travel",
    mode: "solo",
    period: { label: "제주 여행" },
    templateId: template.id,
    questionSetMode: "light",
    questionGroups,
    answers,
    representativeSentence: sampleAnswers.travel_first_scene,
    visibility: "private",
    isCompleted: true,
    completionRate: calculateCompletionRate(questionGroups, answers),
    createdAt: now,
    updatedAt: now,
  };
}
