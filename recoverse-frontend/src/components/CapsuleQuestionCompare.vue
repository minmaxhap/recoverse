<template>
  <div class="detailBlock">
    <h3 class="noWrap">{{ text.title }}</h3>
    <div v-if="compareQuestions.length" class="chips">
      <button
        v-for="item in compareQuestions"
        :key="item.questionText"
        class="chip"
        :class="{ active: item.questionText === selectedQuestion }"
        @click="selectedQuestion = item.questionText"
      >
        {{ item.questionText }} · {{ item.count }}
      </button>
    </div>
    <div v-else class="empty">
      {{ text.empty }}
    </div>

    <div v-if="timeline.length" class="timeline">
      <div v-for="item in timeline" :key="item.card.id" class="tlCard">
        <div class="tlHead">
          <span class="tlYear noWrap">{{ item.capsuleTitle }}</span>
          <button class="small" @click="$emit('open-card', item.card.capsuleId, item.card.id)">
            {{ text.open }}
          </button>
        </div>
        <ol v-if="item.card.answers.length" class="answerList">
          <li v-for="(answer, idx) in item.card.answers" :key="idx" class="answerItem">
            {{ answer }}
          </li>
        </ol>
        <div v-else class="muted">{{ text.noAnswer }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { AppLanguage, Capsule, CapsuleCard } from "../lib/recoverseStore";

const props = defineProps<{
  capsules: Capsule[];
  cards: CapsuleCard[];
  language: AppLanguage;
}>();

defineEmits<{
  "open-card": [capsuleId: string, cardId: string];
}>();

const selectedQuestion = ref("");

const text = computed(() =>
  props.language === "ko"
    ? {
        title: "반복 질문 비교",
        empty: "여러 기억 행성에 같은 질문이 생기면 여기에서 비교할 수 있어요.",
        open: "열기",
        noAnswer: "(아직 답변 없음)",
      }
    : {
        title: "Repeated Question Comparison",
        empty: "When the same question appears in multiple memory planets, compare it here.",
        open: "Open",
        noAnswer: "(No answer yet)",
      }
);

const compareQuestions = computed(() => {
  const map = new Map<string, number>();
  for (const card of props.cards) {
    const question = card.questionText.trim();
    if (!question) continue;
    map.set(question, (map.get(question) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .filter(([, count]) => count > 1)
    .map(([questionText, count]) => ({ questionText, count }))
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.questionText.localeCompare(b.questionText);
    });
});

const timeline = computed(() => {
  const question = selectedQuestion.value.trim();
  if (!question) return [];

  return props.cards
    .filter((card) => card.questionText.trim() === question)
    .map((card) => ({
      card,
      capsuleTitle:
        props.capsules.find((capsule) => capsule.id === card.capsuleId)?.title ?? "알 수 없는 행성",
    }))
    .sort((a, b) => a.capsuleTitle.localeCompare(b.capsuleTitle));
});

watch(compareQuestions, (items) => {
  if (!selectedQuestion.value && items[0]) {
    selectedQuestion.value = items[0].questionText;
    return;
  }
  if (selectedQuestion.value && !items.some((item) => item.questionText === selectedQuestion.value)) {
    selectedQuestion.value = items[0]?.questionText ?? "";
  }
});
</script>

<style scoped>
.detailBlock {
  display: grid;
  gap: 10px;
}

.noWrap {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

h3 {
  margin: 0 0 6px;
  font-size: 13px;
}

.chips {
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.chip {
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--color-text);
}

.chip.active {
  border-color: var(--color-text);
  background: var(--color-text);
  color: var(--color-paper);
}

.empty {
  padding: 14px 12px;
  color: var(--color-muted);
  font-size: 13px;
}

.timeline {
  display: grid;
  gap: 10px;
}

.tlCard {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 12px;
  background: var(--color-paper);
}

.tlHead {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tlYear {
  font-weight: 900;
  font-size: 16px;
  flex: 1;
}

.small {
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.answerList {
  margin: 0;
  padding-left: 18px;
  line-height: 1.55;
}

.answerItem {
  margin: 2px 0;
}

.muted {
  color: var(--color-muted);
  font-size: 12px;
}
</style>
