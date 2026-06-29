import { computed, onBeforeUnmount, ref } from "vue";
import type { Ref } from "vue";
import {
  clearReflectionDraft,
  loadReflectionDraft,
  saveReflectionDraft,
} from "../lib/reflectionDraftStore";
import type { Answer, Question, Reflection } from "../types/reflection";

export type DraftSaveStatus = "saved" | "saving" | "error";

type DraftAutosaveOptions = {
  readonly reflection: Readonly<Ref<Reflection | null | undefined>>;
  readonly question: Readonly<Ref<Question | undefined>>;
  readonly currentAnswer: Readonly<Ref<Answer | undefined>>;
};

function formatSavedTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "방금";

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useReflectionDraftAutosave(options: DraftAutosaveOptions) {
  const draft = ref("");
  const draftSaveStatus = ref<DraftSaveStatus>("saved");
  const lastDraftSavedAt = ref<string | null>(null);
  const isHydratingDraft = ref(false);
  let draftStatusTimer: number | null = null;

  function clearDraftStatusTimer() {
    if (!draftStatusTimer) return;
    window.clearTimeout(draftStatusTimer);
    draftStatusTimer = null;
  }

  const draftSaveLabel = computed(() => {
    if (draftSaveStatus.value === "error") return "임시저장을 확인할 수 없어요";
    if (draftSaveStatus.value === "saving") return "저장 중";
    if (!lastDraftSavedAt.value) return "입력하면 자동 저장돼요";

    return `임시저장 ${formatSavedTime(lastDraftSavedAt.value)}`;
  });

  function markDraftSaved(updatedAt: string) {
    draftSaveStatus.value = "saved";
    lastDraftSavedAt.value = updatedAt;
  }

  function hydrateCurrentDraft() {
    clearDraftStatusTimer();
    isHydratingDraft.value = true;
    const reflectionId = options.reflection.value?.id;
    const questionId = options.question.value?.id;
    const savedDraft = reflectionId && questionId ? loadReflectionDraft(reflectionId, questionId) : null;

    draft.value = savedDraft?.value ?? options.currentAnswer.value?.value ?? "";
    draftSaveStatus.value = "saved";
    lastDraftSavedAt.value = savedDraft?.updatedAt ?? options.currentAnswer.value?.updatedAt ?? null;
    isHydratingDraft.value = false;
  }

  function saveCurrentDraft() {
    const reflection = options.reflection.value;
    const question = options.question.value;
    if (isHydratingDraft.value || !reflection || !question) return;

    draftSaveStatus.value = "saving";
    const result = saveReflectionDraft({
      reflectionId: reflection.id,
      questionId: question.id,
      value: draft.value,
    });

    if (!result.ok) {
      draftSaveStatus.value = "error";
      return;
    }

    clearDraftStatusTimer();
    const updatedAt = result.draft?.updatedAt ?? new Date().toISOString();
    draftStatusTimer = window.setTimeout(() => markDraftSaved(updatedAt), 120);
  }

  function clearCurrentDraft() {
    clearDraftStatusTimer();
    const reflection = options.reflection.value;
    const question = options.question.value;
    if (!reflection || !question) return;
    clearReflectionDraft(reflection.id, question.id);
  }

  onBeforeUnmount(() => {
    clearDraftStatusTimer();
  });

  return {
    draft,
    draftSaveStatus,
    draftSaveLabel,
    hydrateCurrentDraft,
    saveCurrentDraft,
    clearCurrentDraft,
  };
}