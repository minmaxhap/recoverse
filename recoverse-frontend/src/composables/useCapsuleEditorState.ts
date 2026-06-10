import { computed, reactive, ref, type Ref } from "vue";
import type { Capsule, CapsuleCard, CapsuleType } from "../lib/recoverseStore";
import { findMostRecentlyAnsweredCardId } from "../lib/capsuleHomeData";

export function useCapsuleEditorState(
  capsules: Ref<Capsule[]>,
  capsuleCards: Ref<CapsuleCard[]>
) {
  const selectedCapsuleId = ref<string | null>(null);
  const selectedCapsuleCardId = ref<string | null>(null);
  const showUnansweredCardsOnly = ref(false);

  const capsuleForm = reactive<{
    title: string;
    description: string;
    type: CapsuleType;
    templateId: string;
  }>({
    title: "",
    description: "",
    type: "year",
    templateId: "template_year",
  });

  const capsuleCardForm = reactive({
    questionText: "",
    answersText: "",
  });

  const selectedCapsule = computed(() => {
    if (!selectedCapsuleId.value) return null;
    return capsules.value.find((capsule) => capsule.id === selectedCapsuleId.value) ?? null;
  });

  const selectedCapsuleCards = computed(() => {
    if (!selectedCapsuleId.value) return [];
    return capsuleCards.value
      .filter((card) => card.capsuleId === selectedCapsuleId.value)
      .sort((a, b) => a.order - b.order);
  });

  const selectedCapsuleCard = computed(() => {
    if (!selectedCapsuleCardId.value) return null;
    return capsuleCards.value.find((card) => card.id === selectedCapsuleCardId.value) ?? null;
  });

  const recentlyEditedCapsuleCardId = computed(() => {
    return findMostRecentlyAnsweredCardId(selectedCapsuleCards.value);
  });

  function resetCapsuleForm() {
    capsuleForm.title = "";
    capsuleForm.description = "";
    capsuleForm.type = "year";
    capsuleForm.templateId = "template_year";
  }

  function resetCapsuleCardForm() {
    capsuleCardForm.questionText = "";
    capsuleCardForm.answersText = "";
  }

  function startCapsuleCardEdit(card: CapsuleCard) {
    capsuleCardForm.questionText = card.questionText;
    capsuleCardForm.answersText = card.answers.join("\n");
  }

  return {
    selectedCapsuleId,
    selectedCapsuleCardId,
    showUnansweredCardsOnly,
    capsuleForm,
    capsuleCardForm,
    selectedCapsule,
    selectedCapsuleCards,
    selectedCapsuleCard,
    recentlyEditedCapsuleCardId,
    resetCapsuleForm,
    resetCapsuleCardForm,
    startCapsuleCardEdit,
  };
}
